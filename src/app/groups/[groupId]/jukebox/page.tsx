"use client";

import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { Input } from "@/components/ui/input";
import { IJukebox, ISong } from "@/db/models/Jukebox";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import fetcher from "@/lib/fetcher";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { IUser } from "@/db/models/user";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { ListCollapse } from "lucide-react";

//TODO submission doesnt refresh
//TODO manual expanded dont switch
//TODO sort by rating

const JukeboxPage = () => {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  
  const { data, error, isLoading } = useSWR<{ data: IJukebox[] }>(
    user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
    fetcher
  );
  
  useEffect(() => {
    if (data?.data[0]) {
      console.log(data)
      setUserHasSubmitted(
        data.data[0].songs.some((song) => 
          typeof song.submittedBy === "object" && "_id" in song.submittedBy && 
          song.submittedBy._id === user?._id
        )
      );
    }
  }, [data, user]);

  const date = data?.data[0]?.date ? new Date(data.data[0].date) : null;
  const month = date
    ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
    : null;

  return (
    <div >
      <Header
        leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
        title={`Jukebox`}
      />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) :
        <>
          {userHasSubmitted ? (
            <JukeboxSubmissions jukebox={data?.data[0]} user={user} toast={toast}/>
          ):
            <JukeboxSearch jukebox={data?.data[0]} user={user} toast={toast} setUserHasSubmitted={setUserHasSubmitted}/>
          }
        </>
      }
      
    </div>
  );
};

function JukeboxSearch({jukebox, user, toast, setUserHasSubmitted}: {jukebox: IJukebox, user: IUser, toast: any, setUserHasSubmitted: React.SetStateAction<any>}) {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null); // Null for no search yet
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchSpotify = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
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
      const response = await fetch(`/api/groups/${groupId}/jukebox/${jukebox._id}/song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id || "",
        },
        body: JSON.stringify({
          spotifyTrackId: selectedTrack.id,
          title: selectedTrack.name,
          artist: selectedTrack.artists.map((a: any) => a.name).join(", "),
          album: selectedTrack.album.name,
          coverImageUrl: selectedTrack.album.images[0]?.url || "",
        }),
      });

      if (response.ok) {
        setSelectedTrack(null);
        setSearchResults(null);
        setUserHasSubmitted(true);
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

function JukeboxSubmissions({ jukebox, user, toast }: { jukebox: IJukebox; user: IUser; toast: any }) {
  const [userHasRated, setUserHasRated] = useState<{ [key: string]: boolean }>({});
  const [selectedSong, setSelectedSong] = useState<ISong | null>(null);
  const [ratingValue, setRatingValue] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSongs, setExpandedSongs] = useState<{ [key: string]: boolean }>({});
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    const ratedSongs = jukebox.songs.reduce((acc, song) => {
      acc[song.spotifyTrackId] = song.ratings.some((rating) => 
        typeof rating.userId === "object" && "_id" in rating.userId && rating.userId._id === user._id);
      return acc;
    }, {} as { [key: string]: boolean });

    setUserHasRated(ratedSongs);
  }, [jukebox.songs, user]);

  const handleSongClick = (song: ISong) => {
    if (!userHasRated[song.spotifyTrackId]) {
      setSelectedSong(song);
      setDrawerOpen(true);
    } else {
      setExpandedSongs((prev) => ({
        ...prev,
        [song.spotifyTrackId]: !prev[song.spotifyTrackId],
      }));
    }
  };

  const handleRateSubmit = async () => {
    if (!selectedSong) return;
    setIsSubmitting(true);
  
    // Optimistically update the UI
    const newRating = { userId: { _id: user._id, username: user.username }, rating: ratingValue };
    
    mutate(
      `/api/groups/${jukebox.groupId}/jukebox?isActive=true`,  // Key for SWR cache update
      (currentData: { data: IJukebox[] } | undefined) => {
        if (!currentData) return currentData;
  
        return {
          ...currentData,
          data: currentData.data.map((j) =>
            j._id === jukebox._id
              ? {
                  ...j,
                  songs: j.songs.map((song) =>
                    song.spotifyTrackId === selectedSong.spotifyTrackId
                      ? {
                          ...song,
                          ratings: [...song.ratings, newRating], // Add new rating
                        }
                      : song
                  ),
                }
              : j
          ),
        };
      },
      false // Don't re-fetch yet, just update cache
    );
  
    try {
      const response = await fetch(
        `/api/groups/${jukebox.groupId}/jukebox/${jukebox._id}/song/${selectedSong.spotifyTrackId}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user._id,
          },
          body: JSON.stringify({ rating: ratingValue }),
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }
  
      setUserHasRated((prev) => ({
        ...prev,
        [selectedSong.spotifyTrackId]: true,
      }));
  
      // Revalidate SWR cache to get fresh data from the backend
      mutate(`/api/groups/${jukebox.groupId}/jukebox?isActive=true`);
  
      setDrawerOpen(false);
      setRatingValue(50);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
  
      // Rollback UI changes if API call fails
      mutate(`/api/groups/${jukebox.groupId}/jukebox?isActive=true`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-bold mb-4 text-center">Playlist</h2>
        <ListCollapse onClick={() => setExpandAll((prev) => !prev)}/>
      </div>

      <div className="space-y-4">
        {jukebox.songs.map((song) => {
          const hasRated = userHasRated[song.spotifyTrackId];
          const isExpanded = expandAll || expandedSongs[song.spotifyTrackId];

          return (
            <div key={song.spotifyTrackId} className="rounded-md shadow-md bg-secondary">
              {/* Clickable Song Card */}
              <div
                className={`flex items-center gap-4 cursor-pointer p-4 rounded-md`}
                onClick={() => handleSongClick(song)}
              >
                <div className="flex-1 flex items-center gap-4">
                  <Image src={song.coverImageUrl} alt={song.title} width={64} height={64} className="rounded-md object-cover" />
                  <div>
                    <p className="text-sm font-bold">{song.title}</p>
                    <p className="text-xs text-secondary-foreground">{song.artist}</p>
                    <p className="text-xs text-gray-400">{song.album}</p>
                  </div>
                </div>

                {hasRated && (
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col justify-center items-center h-12 w-16">
                      <p className="text-sm font-bold">
                        {song.ratings.length > 0
                          ? (song.ratings.reduce((acc, rating) => acc + rating.rating, 0) / song.ratings.length).toFixed(1)
                          : "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">{song.ratings.length} votes</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ratings Section (Shown Only If Clicked & Rated) */}
              {isExpanded && hasRated && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  {song.ratings.map((rating:any) => (
                    <div key={rating.userId._id} className="flex justify-between text-sm p-1 border-b border-gray-300">
                      <span>{rating.userId.username}:</span>
                      <span>{rating.rating}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-4">
          {selectedSong && (
            <>
              <DrawerHeader>
                <DrawerTitle>{selectedSong.title}</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col items-center">
                <Image src={selectedSong.coverImageUrl} alt={selectedSong.title} width={150} height={150} className="rounded-md object-cover" />
                <p className="text-sm font-bold mt-2">{selectedSong.artist}</p>
                <p className="text-xs text-secondary-foreground">{selectedSong.album}</p>
              </div>

              <div className="my-6">
                <Slider defaultValue={[50]} max={100} step={1} onValueChange={(value) => setRatingValue(value[0])} />
                <p className="text-center mt-4">{ratingValue}</p>
              </div>

              <div>
                <Button onClick={handleRateSubmit} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}



export default JukeboxPage;
