import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { markFeatureSeen } from "@/lib/services/activity";
import { ValidationError } from "@/lib/api/errorHandling";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const body = await req.json();
        const feature = body?.feature;
        if (!feature || typeof feature !== "string") {
            throw new ValidationError("feature is required (question, rally, or jukebox)");
        }

        const lastSeenAt = await markFeatureSeen(groupId, userId, feature);
        return NextResponse.json({ feature, lastSeenAt });
    }
);
