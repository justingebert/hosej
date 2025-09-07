import dbConnect from "@/lib/dbConnect";
import {isUserInGroup} from "@/lib/groupAuth";
import Jukebox from "@/db/models/Jukebox";
import {NextRequest, NextResponse} from "next/server";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {NotFoundError, ValidationError} from "@/lib/api/errorHandling";

export const revalidate = 0;

export const POST = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string, jukeboxId: string }
}>) => {
    const {groupId, jukeboxId} = params;

    await dbConnect();
    await isUserInGroup(userId, groupId);

    const body = await req.json();
    const {spotifyTrackId, title, artist, album, coverImageUrl} = body;

    if (!spotifyTrackId || !title || !artist) {
        throw new ValidationError("spotifyTrackId, title, and artist are required");
    }


    const jukebox = await Jukebox.findOne({_id: jukeboxId, groupId, active: true});
    if (!jukebox) {
        throw new NotFoundError("Jukebox not found or is not active");
    }

    jukebox.songs.push({
        spotifyTrackId,
        title,
        artist,
        album,
        coverImageUrl,
        submittedBy: userId,
        ratings: [],
    });

    await jukebox.save();

    return NextResponse.json({message: "Song added to jukebox", data: jukebox}, {status: 201});
});
