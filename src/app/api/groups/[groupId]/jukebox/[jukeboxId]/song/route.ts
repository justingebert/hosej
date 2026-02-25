import { isUserInGroup } from "@/lib/services/group";
import { addSong } from "@/lib/services/jukebox";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { parseBody } from "@/lib/validation/parseBody";
import { AddSongSchema } from "@/lib/validation/jukebox";

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

        await isUserInGroup(userId, groupId);

        const body = await parseBody(req, AddSongSchema);
        const jukebox = await addSong(jukeboxId, groupId, userId, body);

        return NextResponse.json(
            { message: "Song added to jukebox", data: jukebox },
            { status: 201 }
        );
    }
);
