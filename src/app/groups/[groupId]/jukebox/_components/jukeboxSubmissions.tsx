import type { IJukeboxProcessed, IProcessedSong } from "@/types/models/jukebox";
import type { Session } from "next-auth";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { useState } from "react";
import { mutate } from "swr";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { SiApplemusic } from "react-icons/si";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ChatComponent from "@/components/common/Chat";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function JukeboxSubmissions({
    jukebox,
    user,
    toast,
}: {
    jukebox: IJukeboxProcessed;
    user: Session["user"];
    toast: any;
}) {
    const { play } = useAppHaptics();
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
        play("selection");
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
            play("success");
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

    const handleExternalLinkTap = () => {
        play("navigation");
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
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        {song.submittedBy.avatarUrl && (
                                                            <AvatarImage
                                                                src={song.submittedBy.avatarUrl}
                                                                alt={song.submittedBy.username}
                                                            />
                                                        )}
                                                        <AvatarFallback className="text-[10px]">
                                                            {song.submittedBy.username[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
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
                                                        onClick={handleExternalLinkTap}
                                                    >
                                                        <SiApplemusic size={32} color="#FF4E6B" />
                                                    </Link>
                                                    <Link
                                                        href={`https://open.spotify.com/track/${song.spotifyTrackId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-green-500"
                                                        onClick={handleExternalLinkTap}
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
                                                        onClick={handleExternalLinkTap}
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
                                                        <div className="flex justify-between items-center text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    {rating.userId.avatarUrl && (
                                                                        <AvatarImage
                                                                            src={
                                                                                rating.userId
                                                                                    .avatarUrl
                                                                            }
                                                                            alt={
                                                                                rating.userId
                                                                                    .username
                                                                            }
                                                                        />
                                                                    )}
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {rating.userId.username[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>
                                                                    {rating.userId.username}
                                                                </span>
                                                            </div>
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
                                    onClick={handleExternalLinkTap}
                                >
                                    <SiApplemusic size={32} color="#FF4E6B" />
                                </Link>
                                <Link
                                    href={`https://open.spotify.com/track/${selectedSong.spotifyTrackId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-green-500"
                                    onClick={handleExternalLinkTap}
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
                                    onClick={handleExternalLinkTap}
                                >
                                    <FaYoutube size={32} />
                                </Link>
                            </div>
                            <div className="my-10">
                                <p className="text-center text-xl font-bold mb-10">{ratingValue}</p>
                                <Slider
                                    defaultValue={[50]}
                                    min={1}
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
