import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { updatePackStatus, deletePack } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { UpdatePackStatusSchema } from "@/lib/validation/admin";

export const PATCH = withAuthAndErrors(
    async (req: NextRequest, { params, userId }: AuthedContext<{ params: { packId: string } }>) => {
        const isAdmin = await isGlobalAdmin(userId);
        if (!isAdmin) {
            throw new ForbiddenError("Global admin access required");
        }

        const { status } = await parseBody(req, UpdatePackStatusSchema);
        const pack = await updatePackStatus(params.packId, status);

        return NextResponse.json(pack, { status: 200 });
    }
);

export const DELETE = withAuthAndErrors(
    async (
        _req: NextRequest,
        { params, userId }: AuthedContext<{ params: { packId: string } }>
    ) => {
        const isAdmin = await isGlobalAdmin(userId);
        if (!isAdmin) {
            throw new ForbiddenError("Global admin access required");
        }

        const result = await deletePack(params.packId);
        return NextResponse.json(result, { status: 200 });
    }
);
