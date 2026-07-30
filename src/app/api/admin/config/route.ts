import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ForbiddenError } from "@/lib/api/errorHandling";
import { getGlobalConfig, isGlobalAdmin } from "@/lib/services/user/admin";

// Get admin config
export const GET = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const config = await getGlobalConfig();

    // Read-only: feature gating is gone, so there is nothing left to configure.
    return NextResponse.json(
        {
            adminUsers: config.adminUsers,
            updatedAt: config.updatedAt,
        },
        { status: 200 }
    );
});
