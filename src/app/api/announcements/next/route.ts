import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getUserById } from "@/lib/services/user/user";
import { resolveNextAnnouncement } from "@/lib/announcements/resolve";

export const GET = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const user = await getUserById(userId);
    const announcement = resolveNextAnnouncement(user.toObject());
    return NextResponse.json({ announcement }, { status: 200 });
});
