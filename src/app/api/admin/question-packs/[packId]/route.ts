import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isGlobalAdmin } from "@/lib/services/user/admin";
import { updatePack, deletePack } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { UpdatePackSchema } from "@/lib/validation/admin";

export const PATCH = withAuthAndErrors(
    async (req: NextRequest, { params, userId }: AuthedContext<{ params: { packId: string } }>) => {
        const isAdmin = await isGlobalAdmin(userId);
        if (!isAdmin) {
            throw new ForbiddenError("Global admin access required");
        }

        const updates = await parseBody(req, UpdatePackSchema);
        const pack = await updatePack(params.packId, updates);

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
