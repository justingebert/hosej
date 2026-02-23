import { isUserInGroup } from "@/lib/services/group";
import { searchSpotifyTracks } from "@/lib/services/jukebox";
import { ValidationError } from "@/lib/api/errorHandling";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { groupId } = params;
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query) {
            throw new ValidationError("Missing search query parameter");
        }

        await isUserInGroup(userId, groupId);
        const data = await searchSpotifyTracks(query);
        return NextResponse.json(data);
    }
);
