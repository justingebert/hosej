import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ForbiddenError } from "@/lib/api/errorHandling";
import { getGlobalConfig, isGlobalAdmin, updateGlobalConfig } from "@/lib/services/user/admin";

// Get admin config
export const GET = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const config = await getGlobalConfig();

    return NextResponse.json(
        {
            features: config.features,
            adminUsers: config.adminUsers,
            updatedAt: config.updatedAt,
        },
        { status: 200 }
    );
});

// Update admin config
export const PUT = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const data = await req.json();
    const config = await updateGlobalConfig(data);

    return NextResponse.json(
        {
            features: config.features,
            adminUsers: config.adminUsers,
            updatedAt: config.updatedAt,
        },
        { status: 200 }
    );
});
