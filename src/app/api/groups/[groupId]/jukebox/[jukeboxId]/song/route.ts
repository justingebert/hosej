import dbConnect from "@/db/dbConnect";
import { isUserInGroup } from "@/lib/services/group";
import Jukebox from "@/db/models/Jukebox";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { createSong, ISong } from "@/types/models/jukebox";

export const revalidate = 0;

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; jukeboxId: string };
        }>
    ) => {
        const { groupId, jukeboxId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const body = await req.json();
        const { spotifyTrackId, title, artist, album, coverImageUrl } = body;

        if (!spotifyTrackId || !title || !artist) {
            throw new ValidationError("spotifyTrackId, title, and artist are required");
        }

        const jukebox = await Jukebox.findOne({ _id: jukeboxId, groupId, active: true });
        if (!jukebox) {
            throw new NotFoundError("Jukebox not found");
        }

        const newSong: createSong = {
            spotifyTrackId,
            title,
            artist,
            album,
            coverImageUrl,
            submittedBy: userId,
            ratings: [],
        };

        jukebox.songs.push(newSong as ISong);

        await jukebox.save();

        return NextResponse.json(
            { message: "Song added to jukebox", data: jukebox },
            { status: 201 }
        );
    }
);
