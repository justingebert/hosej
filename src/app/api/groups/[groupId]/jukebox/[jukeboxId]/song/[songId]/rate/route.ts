import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isUserInGroup } from "@/lib/services/group";
import { rateSong } from "@/lib/services/jukebox";
import { parseBody } from "@/lib/validation/parseBody";
import { RateSongSchema } from "@/lib/validation/jukebox";

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
        const { groupId, jukeboxId, songId } = params;
        const { rating } = await parseBody(req, RateSongSchema);

        await isUserInGroup(userId, groupId);

        const song = await rateSong(jukeboxId, songId, userId, rating);

        return NextResponse.json(
            { message: "Rating submitted successfully", data: song },
            { status: 201 }
        );
    }
);
