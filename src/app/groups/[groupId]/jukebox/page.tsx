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

const JukeboxPage = () => {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null); // Store the selected track
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error } = useSWR<{ data: IJukebox[] }>(
    user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
    fetcher
  );

  const date = data?.data[0]?.date ? new Date(data.data[0].date) : null;
  const month = date
    ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
    : null;

  const searchSpotify = async () => {
    if (!searchQuery) return;

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
    setSelectedTrack(track); // Store the selected track
    console.log("Selected song:", track);
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      alert("Please select a song before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/jukebox/song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "", // Add the user ID from the session
        },
        body: JSON.stringify({
          jukeboxId: data?.data[0]?._id, // Assuming the active Jukebox ID is in the data
          spotifyTrackId: selectedTrack.id,
          title: selectedTrack.name,
          artist: selectedTrack.artists.map((a: any) => a.name).join(", "),
          album: selectedTrack.album.name,
          coverImageUrl: selectedTrack.album.images[0]?.url || "",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Song submitted successfully:", result);
        alert("Song added to the jukebox!");
        setSelectedTrack(null); // Clear selection after successful submission
      } else {
        const errorData = await response.json();
        console.error("Error submitting song:", errorData);
        alert(errorData.message || "Failed to submit the song.");
      }
    } catch (error) {
      console.error("Error submitting song:", error);
      alert("An error occurred while submitting the song.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Header
        leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
        title={`Jukebox - ${month || ""}`}
      />
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
      <div className="mt-4">
        {searchResults.length > 0 ? (
          <ul className="space-y-2">
            {searchResults.map((track) => (
              <li
                key={track.id}
                className={`p-4 rounded-md shadow-md flex items-center gap-4 cursor-pointer ${
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
                  <p className="text-xs text-secondary-foreground">
                    {track.artists.map((a: any) => a.name).join(", ")}
                  </p>
                  <p className="text-xs text-gray-400">{track.album.name}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          searchQuery && !isLoading && <p className="text-center text-gray-500">No results found</p>
        )}
      </div>
      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!selectedTrack || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Selected Song"}
        </Button>
      </div>
    </div>
  );
};

export default JukeboxPage;