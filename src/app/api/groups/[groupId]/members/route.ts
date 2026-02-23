import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getGroupMembers, joinGroup } from "@/lib/services/group";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const members = await getGroupMembers(userId, params.groupId);
        return NextResponse.json(members, { status: 200 });
    }
);

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { group, username } = await joinGroup(userId, params.groupId);
        return NextResponse.json(
            { message: `User ${username} successfully joined the group`, group },
            { status: 200 }
        );
    }
);
