import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ForbiddenError } from "@/lib/api/errorHandling";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { aggregateAllAnnouncements } from "@/lib/services/announcements/aggregate";

export const GET = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const announcements = await aggregateAllAnnouncements();
    return NextResponse.json({ announcements }, { status: 200 });
});
