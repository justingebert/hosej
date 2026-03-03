import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { getAllGroups } from "@/lib/services/group";

export const GET = withAuthAndErrors(async (_req, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError("Global admin access required");
    }

    const groups = await getAllGroups();
    return NextResponse.json(groups, { status: 200 });
});
