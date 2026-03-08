import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { markDashboardSeen } from "@/lib/services/activity";

export const POST = withAuthAndErrors(
    async (_req, { params, userId }: AuthedContext<{ params: { groupId: string } }>) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const lastDashboardVisitAt = await markDashboardSeen(groupId, userId);
        return NextResponse.json({ lastDashboardVisitAt });
    }
);
