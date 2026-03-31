import type { IJukeboxProcessed } from "@/types/models/jukebox";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { useParams } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader, Search } from "lucide-react";
import Image from "next/image";

export function JukeboxSearch({
    jukebox,
    toast,
    setUserHasSubmitted,
}: {
    jukebox: IJukeboxProcessed;
    toast: any;
    setUserHasSubmitted: React.SetStateAction<any>;
}) {
    const { play } = useAppHaptics();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[] | null>(null); // Null for no search yet
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchSpotify = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/groups/${groupId}/jukebox/search?q=${encodeURIComponent(searchQuery)}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch search results");
            }
            const result = await response.json();
            setSearchResults(result.tracks.items || []);
        } catch (err) {
            toast({
                title: "Something went wrong",
                description: "Please try again later",
                variant: "destructive",
            });
            console.error("Error searching Spotify:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitTrack = async () => {
        if (!selectedTrack) {
            toast({
                title: "No song selected",
                description: "Please select a song.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/groups/${groupId}/jukebox/${jukebox._id}/song`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    spotifyTrackId: selectedTrack.id,
                    title: selectedTrack.name,
                    artist: selectedTrack.artists.map((a: any) => a.name).join(", "),
                    album: selectedTrack.album.name,
                    coverImageUrl: selectedTrack.album.images[0]?.url || "",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to submit song");
            }
            mutate(`/api/groups/${groupId}/jukebox?isActive=true`);
            play("success");

            setSelectedTrack(null);
            setSearchResults(null);
            setUserHasSubmitted(true);
        } catch (error) {
            console.error("Error submitting song:", error);
            toast({
                title: "Error",
                description: "An error occurred while submitting the song.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    function songSearchLoadingSkeleton() {
        return (
            <ul className="space-y-3">
                {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="p-3 rounded-md flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-md bg-primary-foreground" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 bg-primary-foreground" />
                            <Skeleton className="h-4 w-1/2 bg-primary-foreground" />
                        </div>
                    </Skeleton>
                ))}
            </ul>
        );
    }

    return (
        <>
            <div className="relative w-full">
                <Input
                    placeholder="Search for a song..."
                    className="w-full pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            searchSpotify();
                        }
                    }}
                />
                <Button
                    onClick={searchSpotify}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                    disabled={isLoading}
                    variant={"ghost"}
                >
                    {isLoading ? <Loader /> : <Search />}
                </Button>
            </div>
            <div className="mt-4 pb-28">
                {isLoading ? (
                    songSearchLoadingSkeleton()
                ) : searchResults === null ? null : searchResults.length > 0 ? ( // Display nothing if no search has been performed yet
                    <ul className="space-y-3">
                        {searchResults.map((track) => (
                            <li
                                key={track.id}
                                className={`p-3 rounded-md shadow-md flex items-center gap-4 cursor-pointer ${
                                    selectedTrack?.id === track.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary"
                                }`}
                                onClick={() => {
                                    play("selection");
                                    setSelectedTrack(track);
                                }}
                            >
                                <Image
                                    src={track.album.images[0]?.url || ""}
                                    alt={track.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover"
                                />
                                <div>
                                    <p className="text-sm font-bold">{track.name}</p>
                                    <p className="text-xs ">
                                        {track.artists.map((a: any) => a.name).join(", ")}
                                    </p>
                                    <p className="text-xs text-gray-400">{track.album.name}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">No results found</p>
                )}
            </div>
            <div className="fixed bottom-0 left-0 w-full backdrop-blur-md pb-10 pt-4 px-6">
                <Button
                    onClick={handleSubmitTrack}
                    className="w-full h-12 text-lg font-bold"
                    disabled={!selectedTrack || isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </>
    );
}
