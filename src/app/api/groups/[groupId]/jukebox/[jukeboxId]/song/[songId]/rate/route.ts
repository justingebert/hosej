import {NextRequest, NextResponse} from "next/server";
import dbConnect from "@/lib/dbConnect";
import Jukebox from "@/db/models/Jukebox";
import {isUserInGroup} from "@/lib/groupAuth";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, jukeboxId: string, songId: string }
}>) => {
    const {groupId, jukeboxId, songId} = params;
    const {rating} = await req.json();
    await dbConnect();
    await isUserInGroup(userId, groupId);

    const jukebox = await Jukebox.findById(jukeboxId);
    if (!jukebox) {
        return NextResponse.json({error: "Jukebox not found or inactive"}, {status: 404});
    }
    const song = jukebox.songs.find((s: any) => s.spotifyTrackId === songId);
    if (!song) {
        return NextResponse.json({error: "Song not found in jukebox"}, {status: 404});
    }

    // Check if user has already rated the song
    const existingRating = song.ratings.find((r: any) => r.userId.toString() === userId);
    if (existingRating) {
        return NextResponse.json({error: "You have already rated this song"}, {status: 400});
    }

    // Add the new rating
    song.ratings.push({userId: userId, rating: rating});

    // Save the updated jukebox
    await jukebox.save();

    return NextResponse.json({message: "Rating submitted successfully", data: song}, {status: 201});
})
