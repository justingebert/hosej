import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getUserById, createDeviceUser, updateUser } from "@/lib/services/user/user";
import type { UpdateUserData } from "@/types/models/user";

export const GET = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const user = await getUserById(userId);
    return NextResponse.json(user, { status: 200 });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
    const { deviceId, userName } = await req.json();
    const user = await createDeviceUser(deviceId, userName);
    return NextResponse.json(user, { status: 201 });
});

export const PUT = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const body: UpdateUserData = await req.json();
    const user = await updateUser(userId, body);
    return NextResponse.json(user, { status: 200 });
});
