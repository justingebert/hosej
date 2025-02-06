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
import { FoldVertical, Loader, Search, UnfoldVertical } from "lucide-react";
import { IJukeboxProcessed, IProcessedSong } from "./types";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import Link from "next/link";
import { SiApplemusic } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";

//TODO sort by rating
//TODO out animation not working

const JukeboxPage = () => {
  const { user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  
  const { data, error, isLoading } = useSWR<{ data: IJukeboxProcessed[] }>(
    user ? `/api/groups/${groupId}/jukebox?isActive=true&processed=true` : null,
    fetcher
  );
  
  useEffect(() => {
    if (data?.data[0]) {
      setUserHasSubmitted(
        data.data[0].userHasSubmitted
      );
    }
  }, [data, user]);

  const date = data?.data[0]?.date ? new Date(data.data[0].date) : null;
  const month = date
    ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
    : null;

  return (
    <>
      <Header
        leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
        title={`Jukebox`}
      />
      {isLoading || !data ? (
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
      ) :
        <>
          {userHasSubmitted ? (
            <JukeboxSubmissions jukebox={data?.data[0]} user={user} toast={toast}/>
          ):
            <JukeboxSearch jukebox={data?.data[0]} user={user} toast={toast} setUserHasSubmitted={setUserHasSubmitted}/>
          }
        </>
      }
      
    </>
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
          "x-user-id": user._id || "",
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

        const newSong = {
          spotifyTrackId: selectedTrack.id,
          title: selectedTrack.name,
          artist: selectedTrack.artists.map((a: any) => a.name).join(", "),
          album: selectedTrack.album.name,
          coverImageUrl: selectedTrack.album.images[0]?.url || "",
          submittedBy: user._id, 
          ratings: [],
        };
        
        mutate(
          `/api/groups/${groupId}/jukebox?isActive=true&processed=true`,
          (currentData: { data: IJukeboxProcessed[] } | undefined) => {
            if (!currentData) return currentData;
            return {
              data: currentData.data.map((j) =>
                j._id === jukebox._id
                  ? { ...j, userHasSubmitted: true, songs: [...j.songs, newSong] }
                  : j
              ),
            } as { data: IJukeboxProcessed[] };
          },
          false // Do not revalidate immediately
        );

        setSelectedTrack(null);
        setSearchResults(null);
        setUserHasSubmitted(true);

      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.message || "Failed to submit the song." });
      }
    } catch (error) {
      console.error("Error submitting song:", error);
      toast({ title: "Error", description: "An error occurred while submitting the song.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Button onClick={searchSpotify} className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2" disabled={isLoading} variant={"ghost"}>
          {isLoading ? <Loader /> : <Search/>}
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

function JukeboxSubmissions({ jukebox, user, toast }: { jukebox: IJukeboxProcessed; user: IUser; toast: any }) {
  const [selectedSong, setSelectedSong] = useState<IProcessedSong | null>(null);
  const [ratingValue, setRatingValue] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSongs, setExpandedSongs] = useState<{ [key: string]: boolean }>({});
  const [expandAll, setExpandAll] = useState(false);

  const handleExpandAll = () => {
    setExpandAll((prevExpandAll) => {
      const newExpandAll = !prevExpandAll;
      setExpandedSongs(
        newExpandAll
          ? Object.fromEntries(jukebox.songs.map((song) => [song.spotifyTrackId, true])) // Expand all
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
        [song.spotifyTrackId]: !prev[song.spotifyTrackId],
      }));
    }
  };

  const handleRateSubmit = async () => {
    if (!selectedSong) return;
    setIsSubmitting(true);

    const newRating = { userId: { _id: user._id, username: user.username }, rating: ratingValue };

    mutate(
      `/api/groups/${jukebox.groupId}/jukebox?isActive=true&processed=true`,
      (currentData: { data: IJukeboxProcessed[] } | undefined) => {
        if (!currentData) return currentData;
    
        return {
          data: currentData.data.map((j) => {
            if (j._id === jukebox._id) {
              const updatedSongs = j.songs.map((song) => {
                if (song.spotifyTrackId === selectedSong.spotifyTrackId) {
                  // Append the new rating and then sort the ratings array
                  const newRatings = [...song.ratings, newRating].sort((a, b) => b.rating - a.rating);
                  const avgRating =
                    newRatings.length > 0
                      ? newRatings.reduce((acc, r) => acc + r.rating, 0) / newRatings.length
                      : null;
                  return { ...song, ratings: newRatings, avgRating };
                }
                return song;
              });
    
              // Re-sort the songs array by average rating (highest first)
              updatedSongs.sort((a, b) => {
                if (a.avgRating === null && b.avgRating === null) return 0;
                if (a.avgRating === null) return 1;
                if (b.avgRating === null) return -1;
                return b.avgRating - a.avgRating;
              });
    
              return { ...j, songs: updatedSongs };
            }
            return j;
          }),
        } as { data: IJukeboxProcessed[] };
      },
      false // Avoid immediate revalidation
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

      // Revalidate SWR cache to get fresh data from the backend
      mutate(`/api/groups/${jukebox.groupId}/jukebox?isActive=true&processed=true`);

      setDrawerOpen(false);
      setRatingValue(50);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });

      // Rollback UI changes if API call fails
      mutate(`/api/groups/${jukebox.groupId}/jukebox?isActive=true&processed=true`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rollOutVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  };

  return (
    <div className="pb-20">
      <div className="flex justify-end mb-2 -mt-4">
        <Button onClick={handleExpandAll} variant={"ghost"}>
          {expandAll ? <FoldVertical size={20}/> : <UnfoldVertical size={20}/>}
        </Button>
      </div>

      <div className="space-y-4">
        {jukebox.songs.map((song) => {
          const isExpanded = expandedSongs[song.spotifyTrackId] || false;
          const rating = song.avgRating || 0;
          const ratingColor =
            rating <= 33 ? "bg-red-500" : rating <= 66 ? "bg-orange-500" : "bg-green-500";
          
          return (
            <>
            <div key={song.spotifyTrackId} className="rounded-md shadow-md bg-secondary">
              <div
                className="flex items-center gap-4 cursor-pointer p-4 rounded-md"
                onClick={() => handleSongClick(song)}
              >
                <div className="flex-1 flex items-center gap-4">
                  <Image src={song.coverImageUrl} alt={song.title} width={64} height={64} className="rounded-md object-cover" />
                  <div>
                    <p className="text-sm font-bold">{song.title}</p>
                    <p className="text-xs text-secondary-foreground">{song.artist}</p>
                    <p className="text-xs text-muted-foreground">{song.album}</p>
                  </div>
                </div>

                {(song.userHasRated || (user && song.submittedBy._id === user._id)) && (
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col justify-center items-center">
                      <Badge className={`text-sm font-bold ${ratingColor}`}>{song.avgRating ? song.avgRating.toFixed(1) : "N/A"}</Badge>
                      {/* <p className="text-xs text-gray-400">{song.ratings.length} votes</p> */}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {isExpanded && (song.userHasRated || (user && song.submittedBy._id === user._id)) && (
              <div className="px-2">
                <AnimatePresence>
                <div className="flex justify-between items-center rounded-md bg-secondarydark px-4 py-2 shadow-md mb-2">
                  <div className="">
                    {/* <span>submitted by: </span> */}
                    <span>{song.submittedBy.username}</span>
                  </div>
                  <div className="flex flex-row space-x-2">
                    <Link href={`https://music.apple.com/de/search?term=${encodeURIComponent(song.title + " " + song.artist)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-black">
                      <SiApplemusic  size={32} color="#FF4E6B"/> 
                    </Link>
                    <Link href={`https://open.spotify.com/track/${song.spotifyTrackId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500">
                      <FaSpotify size={32} />
                    </Link>
                    <Link href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + " " + song.artist)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600">
                      <FaYoutube size={32} />
                    </Link>
                  </div>
                </div>
                  {song.ratings.map((rating) => {
                    const ratingColorText =
                    rating.rating <= 33 ? "text-red-500" : rating.rating <= 66 ? "text-orange-500" : "text-green-500";
                    return(
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
                          <span className={`font-bold ${ratingColorText}`}>{rating.rating}</span>
                        </div>
                      </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            )}
            </>
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
              <div className="flex flex-row justify-center gap-8 my-4">
                  <Link href={`https://music.apple.com/de/search?term=${encodeURIComponent(selectedSong.title + " " + selectedSong.artist)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-black">
                    <SiApplemusic  size={32} color="#FF4E6B"/> 
                  </Link>
                  <Link href={`https://open.spotify.com/track/${selectedSong.spotifyTrackId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500">
                    <FaSpotify size={32} />
                  </Link>
                  <Link href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedSong.title + " " + selectedSong.artist)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600">
                    <FaYoutube size={32} />
                  </Link>
                </div>
              <div className="my-6">
                <p className="text-center text-xl font-bold mt-4">{ratingValue}</p>
                <Slider defaultValue={[50]} max={100} step={1} onValueChange={(value) => setRatingValue(value[0])} />
              </div>

              <div>
                <Button onClick={handleRateSubmit} className="w-full text-lg font-bold" disabled={isSubmitting}>
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
