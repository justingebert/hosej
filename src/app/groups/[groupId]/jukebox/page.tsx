"use client";

import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { Input } from "@/components/ui/input";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import fetcher from "@/lib/fetcher";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "next-auth";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { FoldVertical, Loader, Search, UnfoldVertical } from "lucide-react";
import type { IJukeboxProcessed, IProcessedSong } from "@/types/models/jukebox";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { SiApplemusic } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import ChatComponent from "@/components/features/chat/Chat.client";
import { Card } from "@/components/ui/card";

function JukeboxPageLoading() {
    return (
        <div className="space-y-3 mt-12">
            {[...Array(8)].map((_, index) => (
                <Skeleton key={index} className="p-3 rounded-md flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-md bg-primary-foreground" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-primary-foreground" />
                        <Skeleton className="h-4 w-1/2 bg-primary-foreground" />
                    </div>
                </Skeleton>
            ))}
        </div>
    );
}

const JukeboxPage = () => {
    const { user } = useAuthRedirect();
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const { toast } = useToast();

    // Track active tab (jukebox) and per-jukebox submission status
    const [activeJukeboxId, setActiveJukeboxId] = useState<string | null>(null);
    const [userHasSubmittedMap, setUserHasSubmittedMap] = useState<Record<string, boolean>>({});

    const { data: jukeboxes, isLoading } = useSWR<IJukeboxProcessed[]>(
        user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
        fetcher
    );

    useEffect(() => {
        if (jukeboxes && jukeboxes.length > 0) {
            // Initialize active tab and userHasSubmitted map from fetched jukeboxes
            setActiveJukeboxId((prev) => prev ?? jukeboxes[0]._id);
            const initMap: Record<string, boolean> = {};
            for (const jukebox of jukeboxes) {
                initMap[jukebox._id] = jukebox.userHasSubmitted;
            }
            setUserHasSubmittedMap(initMap);
        }
    }, [jukeboxes]);

    return (
        <>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
                title={`Jukebox`}
            />
            {isLoading || !jukeboxes ? (
                JukeboxPageLoading()
            ) : jukeboxes.length === 0 ? (
                <div className="flex items-center justify-center">
                    <Card className="text-center p-6 ">
                        <h2 className="font-bold">Not active</h2>
                    </Card>
                    {/*{userIsAdmin && (*/}
                    {/*    <Button*/}
                    {/*        onClick={() => {*/}
                    {/*            fetch(`/api/groups/${groupId}/rally/activate`, {*/}
                    {/*                method: "POST",*/}
                    {/*            });*/}
                    {/*            router.refresh();*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        Activate Rally*/}
                    {/*    </Button>*/}
                    {/*)}*/}
                </div>
            ) : (
                <>
                    {jukeboxes.length > 1 ? (
                        <Tabs
                            value={activeJukeboxId ?? undefined}
                            onValueChange={setActiveJukeboxId}
                        >
                            <TabsList
                                className="grid w-full mb-4"
                                style={{
                                    gridTemplateColumns: `repeat(${jukeboxes.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {jukeboxes.map((j, index) => {
                                    return (
                                        <TabsTrigger
                                            key={j._id}
                                            value={j._id}
                                            className="flex-shrink-0"
                                        >
                                            {j.title ?? `jukebox ${index + 1}`}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                            {jukeboxes.map((j) => {
                                const hasSubmitted =
                                    userHasSubmittedMap[j._id] ?? j.userHasSubmitted;
                                return (
                                    <TabsContent key={j._id} value={j._id} className="mt-4">
                                        {hasSubmitted ? (
                                            <JukeboxSubmissions
                                                jukebox={j}
                                                user={user!}
                                                toast={toast}
                                            />
                                        ) : (
                                            <JukeboxSearch
                                                jukebox={j}
                                                toast={toast}
                                                setUserHasSubmitted={() =>
                                                    setUserHasSubmittedMap((prev) => ({
                                                        ...prev,
                                                        [j._id]: true,
                                                    }))
                                                }
                                            />
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    ) : (
                        // Only one jukebox – render without tabs
                        <>
                            {(userHasSubmittedMap[jukeboxes[0]._id] ??
                            jukeboxes[0].userHasSubmitted) ? (
                                <JukeboxSubmissions
                                    jukebox={jukeboxes[0]}
                                    user={user!}
                                    toast={toast}
                                />
                            ) : (
                                <JukeboxSearch
                                    jukebox={jukeboxes[0]}
                                    toast={toast}
                                    setUserHasSubmitted={() =>
                                        setUserHasSubmittedMap((prev) => ({
                                            ...prev,
                                            [jukeboxes[0]._id]: true,
                                        }))
                                    }
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
};

function JukeboxSearch({
    jukebox,
    toast,
    setUserHasSubmitted,
}: {
    jukebox: IJukeboxProcessed;
    toast: any;
    setUserHasSubmitted: React.SetStateAction<any>;
}) {
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
                                onClick={() => setSelectedTrack(track)}
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

function JukeboxSubmissions({
    jukebox,
    user,
    toast,
}: {
    jukebox: IJukeboxProcessed;
    user: Session["user"];
    toast: any;
}) {
    const [selectedSong, setSelectedSong] = useState<IProcessedSong | null>(null);
    const [ratingValue, setRatingValue] = useState(50);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedSongs, setExpandedSongs] = useState<{ [key: string]: boolean }>({});
    const [expandAll, setExpandAll] = useState(false);
    const [sliderMoved, setSliderMoved] = useState(false);

    const handleExpandAll = () => {
        setExpandAll((prevExpandAll) => {
            const newExpandAll = !prevExpandAll;
            setExpandedSongs(
                newExpandAll
                    ? Object.fromEntries(jukebox.songs.map((song) => [song._id, true])) // Expand all
                    : {} // Collapse all
            );
            return newExpandAll;
        });
    };

    const handleSongClick = (song: IProcessedSong) => {
        if (!song.userHasRated && song.submittedBy._id !== user._id) {
            setSelectedSong(song);
            setDrawerOpen(true);
        } else {
            setExpandedSongs((prev) => ({
                ...prev,
                [song._id]: !prev[song._id],
            }));
        }
    };

    const handleRateSubmit = async () => {
        if (!selectedSong) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(
                `/api/groups/${jukebox.groupId}/jukebox/${jukebox._id}/song/${selectedSong._id}/rate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ rating: ratingValue }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to submit song rating");
            }

            mutate(`/api/groups/${jukebox.groupId}/jukebox?isActive=true`);
        } catch (error) {
            console.error("Error submitting rating:", error);
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setDrawerOpen(false);
            setRatingValue(50);
            setIsSubmitting(false);
            setSliderMoved(false);
        }
    };

    const rollOutVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
    };

    return (
        <>
            <div className="space-y-4">
                {jukebox.songs.map((song, index) => {
                    const isExpanded = expandedSongs[song._id] || false;
                    const rating = song.avgRating || 0;
                    const ratingColor =
                        rating <= 33
                            ? "bg-red-500"
                            : rating <= 66
                              ? "bg-orange-500"
                              : "bg-green-500";

                    return (
                        <>
                            <div key={index} className="rounded-md shadow-md bg-secondary">
                                <div
                                    className="flex items-center gap-4 cursor-pointer p-4 rounded-md"
                                    onClick={() => handleSongClick(song)}
                                >
                                    <div className="flex-1 flex items-center gap-4">
                                        <Image
                                            src={song.coverImageUrl}
                                            alt={song.title}
                                            width={64}
                                            height={64}
                                            className="rounded-md object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-bold">{song.title}</p>
                                            <p className="text-xs text-secondary-foreground">
                                                {song.artist}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {song.album}
                                            </p>
                                        </div>
                                    </div>

                                    {(song.userHasRated ||
                                        (user && song.submittedBy._id === user._id)) && (
                                        <div className="flex items-center space-x-2">
                                            <div className="flex flex-col justify-center items-center">
                                                <Badge
                                                    className={`text-sm font-bold ${ratingColor}`}
                                                >
                                                    {song.avgRating
                                                        ? song.avgRating.toFixed(1)
                                                        : "N/A"}
                                                </Badge>
                                                {/* <p className="text-xs text-gray-400">{song.ratings.length} votes</p> */}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isExpanded &&
                                (song.userHasRated ||
                                    (user && song.submittedBy._id === user._id)) && (
                                    <div className="px-2">
                                        <AnimatePresence>
                                            <div className="flex justify-between items-center rounded-md bg-secondarydark px-4 py-2 shadow-md mb-2">
                                                <div className="">
                                                    {/* <span>submitted by: </span> */}
                                                    <span>{song.submittedBy.username}</span>
                                                </div>
                                                <div className="flex flex-row space-x-2">
                                                    <Link
                                                        href={`https://music.apple.com/de/search?term=${encodeURIComponent(
                                                            song.title + " " + song.artist
                                                        )}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-black"
                                                    >
                                                        <SiApplemusic size={32} color="#FF4E6B" />
                                                    </Link>
                                                    <Link
                                                        href={`https://open.spotify.com/track/${song.spotifyTrackId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-green-500"
                                                    >
                                                        <FaSpotify size={32} />
                                                    </Link>
                                                    <Link
                                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                                            song.title + " " + song.artist
                                                        )}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-red-600"
                                                    >
                                                        <FaYoutube size={32} />
                                                    </Link>
                                                </div>
                                            </div>
                                            {song.ratings.map((rating) => {
                                                const ratingColorText =
                                                    rating.rating <= 33
                                                        ? "text-red-500"
                                                        : rating.rating <= 66
                                                          ? "text-orange-500"
                                                          : "text-green-500";
                                                return (
                                                    <motion.div
                                                        key={rating.userId._id}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        variants={rollOutVariants}
                                                        transition={{ duration: 0.3 }}
                                                        className="mb-2 rounded-md bg-secondarydark px-4 py-2 shadow-md"
                                                    >
                                                        <div className="flex justify-between text-sm">
                                                            <span>{rating.userId.username}</span>
                                                            <span
                                                                className={`font-bold ${ratingColorText}`}
                                                            >
                                                                {rating.rating}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                        </>
                    );
                })}
                <div className="flex justify-end -mt-4">
                    <Button onClick={handleExpandAll} variant={"ghost"}>
                        {expandAll ? <FoldVertical size={20} /> : <UnfoldVertical size={20} />}
                    </Button>
                </div>
            </div>
            <Separator className="my-2" />
            <ChatComponent user={user!} entity={jukebox} available={true} />

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="p-4">
                    {selectedSong && (
                        <>
                            <DrawerHeader>
                                <DrawerTitle>{selectedSong.title}</DrawerTitle>
                            </DrawerHeader>
                            <div className="flex flex-col items-center">
                                <Image
                                    src={selectedSong.coverImageUrl}
                                    alt={selectedSong.title}
                                    width={150}
                                    height={150}
                                    className="rounded-md object-cover"
                                />
                                <p className="text-sm font-bold mt-2">{selectedSong.artist}</p>
                                <p className="text-xs text-secondary-foreground">
                                    {selectedSong.album}
                                </p>
                            </div>
                            <div className="flex flex-row justify-center gap-8 my-4">
                                <Link
                                    href={`https://music.apple.com/de/search?term=${encodeURIComponent(
                                        selectedSong.title + " " + selectedSong.artist
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-black"
                                >
                                    <SiApplemusic size={32} color="#FF4E6B" />
                                </Link>
                                <Link
                                    href={`https://open.spotify.com/track/${selectedSong.spotifyTrackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-green-500"
                                >
                                    <FaSpotify size={32} />
                                </Link>
                                <Link
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                        selectedSong.title + " " + selectedSong.artist
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-red-600"
                                >
                                    <FaYoutube size={32} />
                                </Link>
                            </div>
                            <div className="my-10">
                                <p className="text-center text-xl font-bold mb-10">{ratingValue}</p>
                                <Slider
                                    defaultValue={[50]}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) => {
                                        setRatingValue(value[0]);
                                        setSliderMoved(true);
                                    }}
                                />
                            </div>

                            <div>
                                <Button
                                    onClick={handleRateSubmit}
                                    className="w-full h-12 text-lg font-bold"
                                    disabled={isSubmitting || !sliderMoved}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </Button>
                            </div>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}

export default JukeboxPage;
