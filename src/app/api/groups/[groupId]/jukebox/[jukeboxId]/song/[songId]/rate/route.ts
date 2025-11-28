import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Jukebox from "@/db/models/Jukebox";
import { isUserInGroup } from "@/lib/userAuth";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { ConflictError, NotFoundError } from "@/lib/api/errorHandling";
import { ISong } from "@/types/models/jukebox";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; jukeboxId: string; songId: string };
        }>
    ) => {
        const {groupId, jukeboxId, songId} = params;
        const {rating} = await req.json();
        await dbConnect();
        await isUserInGroup(userId, groupId);

        const jukebox = await Jukebox.findById(jukeboxId);
        if (!jukebox) {
            throw new NotFoundError("Jukebox not found");
        }

        const song = jukebox.songs.find((s: ISong) => s._id.toString() === songId);
        if (!song) {
            throw new NotFoundError("Song not found");
        }

        if (song.submittedBy.toString() === userId) {
            throw new ConflictError("You cannot rate your own song");
        }

        // Check if user has already rated the song
        const existingRating = song.ratings.find((r: any) => r.userId.toString() === userId);
        if (existingRating) {
            throw new ConflictError("User has already rated this song");
        }

        song.ratings.push({userId: userId, rating: rating});

        await jukebox.save();

        return NextResponse.json({message: "Rating submitted successfully", data: song}, {status: 201});
    }
);
