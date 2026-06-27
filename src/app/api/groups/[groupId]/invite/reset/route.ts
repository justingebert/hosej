import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";
import Group from "@/db/models/Group";
import { isUserAdmin, resetInviteCode } from "@/lib/services/group";

// POST /api/groups/[groupId]/invite/reset — regenerate the invite code, killing all
// outstanding links. Admin only.
export const POST = withAuthAndErrors(
    async (
        _req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const group = await Group.findById(params.groupId);
        if (!group) throw new NotFoundError("Group not found");
        await isUserAdmin(userId, params.groupId, group);

        const code = await resetInviteCode(group);
        return NextResponse.json({ code }, { status: 200 });
    }
);
