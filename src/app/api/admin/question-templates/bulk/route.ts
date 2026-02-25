import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { createTemplatesFromArray } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { BulkCreateTemplatesSchema } from "@/lib/validation/admin";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError("Global admin access required");
    }

    const { packId, templates } = await parseBody(req, BulkCreateTemplatesSchema);
    const result = await createTemplatesFromArray(packId, templates);

    return NextResponse.json({ success: true, packId, ...result }, { status: 201 });
});
