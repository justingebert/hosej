import { isUserInGroup } from "@/lib/services/group";
import { getJukeboxes } from "@/lib/services/jukebox";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { groupId } = params;
        const url = new URL(req.url);

        await isUserInGroup(userId, groupId);

        const isActiveParam = url.searchParams.get("isActive");
        const options = isActiveParam !== null ? { isActive: isActiveParam === "true" } : undefined;

        const jukeboxes = await getJukeboxes(userId, groupId, options);

        return NextResponse.json(jukeboxes);
    }
);
