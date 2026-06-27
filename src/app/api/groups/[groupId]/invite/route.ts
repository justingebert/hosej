import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";
import Group from "@/db/models/Group";
import { isUserInGroup, getOrCreateInviteCode } from "@/lib/services/group";

// GET /api/groups/[groupId]/invite — the group's shareable invite code, for any
// member. Lazily generates one for groups created before invite codes existed.
export const GET = withAuthAndErrors(
    async (
        _req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const group = await Group.findById(params.groupId);
        if (!group) throw new NotFoundError("Group not found");
        await isUserInGroup(userId, params.groupId, group);

        const code = await getOrCreateInviteCode(group);
        return NextResponse.json({ code }, { status: 200 });
    }
);
