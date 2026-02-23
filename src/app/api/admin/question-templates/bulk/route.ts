import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ForbiddenError, ValidationError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { createTemplatesFromArray } from "@/lib/services/question";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError("Global admin access required");
    }

    const body = await req.json();
    const { packId, templates } = body;

    if (!packId) throw new ValidationError("packId is required");
    if (!templates) throw new ValidationError("templates array is required");

    const result = await createTemplatesFromArray(packId, templates);

    return NextResponse.json({ success: true, packId, ...result }, { status: 201 });
});
