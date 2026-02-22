import { isUserInGroup } from "@/lib/services/group";
import { addSong } from "@/lib/services/jukebox";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

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

        await isUserInGroup(userId, groupId);

        const body = await req.json();
        const jukebox = await addSong(jukeboxId, groupId, userId, body);

        return NextResponse.json(
            { message: "Song added to jukebox", data: jukebox },
            { status: 201 }
        );
    }
);
