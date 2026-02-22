import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { removeMember } from "@/lib/services/group";

export const DELETE = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; memberId: string } }>
    ) => {
        const { deleted, group } = await removeMember(userId, params.groupId, params.memberId);
        if (deleted) {
            return NextResponse.json({ message: "Group deleted" }, { status: 200 });
        }
        return NextResponse.json(group, { status: 200 });
    }
);
