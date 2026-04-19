import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { getAllPacks } from "@/lib/services/question";

export const GET = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError("Global admin access required");
    }

    const packs = await getAllPacks();
    return NextResponse.json(packs, { status: 200 });
});
