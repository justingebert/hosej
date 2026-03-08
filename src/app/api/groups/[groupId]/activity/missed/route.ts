import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getMissedActivity } from "@/lib/services/activity";

export const GET = withAuthAndErrors(
    async (_req, { params, userId }: AuthedContext<{ params: { groupId: string } }>) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const summary = await getMissedActivity(groupId, userId);
        return NextResponse.json(summary);
    }
);
