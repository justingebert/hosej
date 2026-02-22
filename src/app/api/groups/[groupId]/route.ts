import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getGroupWithAdminFlag, updateGroup, deleteGroup } from "@/lib/services/group";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const group = await getGroupWithAdminFlag(userId, params.groupId);
        return NextResponse.json(group, { status: 200 });
    }
);

export const PUT = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const data = await req.json();
        const group = await updateGroup(userId, params.groupId, data);
        return NextResponse.json(group, { status: 200 });
    }
);

export const DELETE = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        await deleteGroup(userId, params.groupId);
        return NextResponse.json({ message: "Group deleted" }, { status: 200 });
    }
);
