import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { createGroup, getUserGroups } from "@/lib/services/group";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { name } = await req.json();
    const group = await createGroup(userId, name);
    return NextResponse.json(group, { status: 201 });
});

export const GET = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const groups = await getUserGroups(userId);
    return NextResponse.json({ groups }, { status: 200 });
});
