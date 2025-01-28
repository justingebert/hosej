"use client";

import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { Input } from "@/components/ui/input";
import { IJukebox } from "@/db/models/Jukebox";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import fetcher from "@/lib/fetcher";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const JukeboxPage = () => {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();

  const { data, error, isLoading } = useSWR<{ data: IJukebox[] }>(
    user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
    fetcher
  );

  const date = data?.data[0]?.date ? new Date(data.data[0].date) : null;
  const month = date
    ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
    : null;

  const userHasSubmitted = data?.data[0].songs.some((song) => song.submittedBy === user?._id);  

  return (
    <div className="p-4">
      <Header
        leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
        title={`Jukebox - ${month || ""}`}
      />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) :
        <>
          {userHasSubmitted ? (
            <JukeboxSubmissions jukebox={data?.data[0]}/>
          ):
          <JukeboxSearch jukebox={data?.data[0]}/>
          }
        </>
      }
      
    </div>
  );
};

function JukeboxSearch({jukebox}: {jukebox: IJukebox}) {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null); // Null for no search yet
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchSpotify = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Simulate a 3-second delay to test the loader
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await fetch(`/api/groups/${groupId}/jukebox/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      setSearchResults(result.tracks.items || []);
    } catch (err) {
      console.error("Error searching Spotify:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSelect = (track: any) => {
    setSelectedTrack(track);
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      toast({ title: "No song selected", description: "Please select a song before submitting." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/jukebox/song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          jukeboxId: jukebox._id,
          spotifyTrackId: selectedTrack.id,
          title: selectedTrack.name,
          artist: selectedTrack.artists.map((a: any) => a.name).join(", "),
          album: selectedTrack.album.name,
          coverImageUrl: selectedTrack.album.images[0]?.url || "",
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Song added to the jukebox!" });
        setSelectedTrack(null);
        setSearchResults(null);
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.message || "Failed to submit the song." });
      }
    } catch (error) {
      console.error("Error submitting song:", error);
      toast({ title: "Error", description: "An error occurred while submitting the song." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="mt-4">
        <Input
          placeholder="Search for a song..."
          className="w-full text-center"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={searchSpotify} className="w-full mt-2" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      <div className="mt-4 pb-28">
        {isLoading ? (
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
        ) : searchResults === null ? (
          // Display nothing if no search has been performed yet
          null
        ) : searchResults.length > 0 ? (
          <ul className="space-y-3">
            {searchResults.map((track) => (
              <li
                key={track.id}
                className={`p-3 rounded-md shadow-md flex items-center gap-4 cursor-pointer ${
                  selectedTrack?.id === track.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
                onClick={() => handleSongSelect(track)}
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
          onClick={handleSubmit}
          className="w-full h-12 text-lg font-bold"
          disabled={!selectedTrack || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </>
  );
}

function JukeboxSubmissions({jukebox}: {jukebox: IJukebox}) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 text-center">Submitted Songs</h2>
      <div className="space-y-4">
        {jukebox.songs.map((song) => (
          <div
            key={song.spotifyTrackId}
            className="p-4 bg-secondary rounded-md shadow-md flex items-center gap-4"
          >
            {/* Submitted User */}
            <div className="flex flex-col items-center text-center w-1/4">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {typeof song.submittedBy === "string" ? song.submittedBy.slice(0, 2).toUpperCase() : "US"}
                </span>
              </div>
              <p className="text-xs text-secondary-foreground mt-1">Submitted By</p>
            </div>

            {/* Song Details */}
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
                <p className="text-xs text-secondary-foreground">{song.artist}</p>
                <p className="text-xs text-gray-400">{song.album}</p>
              </div>
            </div>

            {/* Ratings */}
            <div className="flex flex-col items-center text-center w-1/4">
              <p className="text-sm font-bold">
                {song.ratings.length > 0
                  ? (
                      song.ratings.reduce((acc, rating) => acc + rating.rating, 0) /
                      song.ratings.length
                    ).toFixed(1)
                  : "N/A"}
              </p>
              <p className="text-xs text-secondary-foreground mt-1">Avg Rating</p>
              <p className="text-xs text-gray-400">{song.ratings.length} votes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default JukeboxPage;
