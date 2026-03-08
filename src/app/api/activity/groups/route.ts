import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getGroupsWithActivity } from "@/lib/services/activity";

export const GET = withAuthAndErrors(async (_req, { userId }: AuthedContext) => {
    const activity = await getGroupsWithActivity(userId);
    return NextResponse.json(activity);
});
