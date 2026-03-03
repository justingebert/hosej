import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import {
    assertGroupAccessOrGlobalAdmin,
    assertGroupAdminOrGlobalAdmin,
} from "@/lib/services/user/admin";
import { addTemplatePackToGroup, getGroupPacks } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { AddPackToGroupSchema } from "@/lib/validation/admin";

export const GET = withAuthAndErrors(
    async (
        _req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        await assertGroupAccessOrGlobalAdmin(userId, params.groupId);
        const packs = await getGroupPacks(params.groupId);
        return NextResponse.json(packs, { status: 200 });
    }
);

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        await assertGroupAdminOrGlobalAdmin(userId, params.groupId);

        const { packId } = await parseBody(req, AddPackToGroupSchema);
        await addTemplatePackToGroup(params.groupId, packId);

        return NextResponse.json({ message: `Pack "${packId}" added to group` }, { status: 201 });
    }
);
