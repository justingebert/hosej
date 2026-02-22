import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { connectGoogleAccount, disconnectGoogleAccount } from "@/lib/services/user/user";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { deviceId } = await req.json();
    await connectGoogleAccount(userId, deviceId);
    return NextResponse.json({ message: "Google account linked successfully." }, { status: 200 });
});

export const DELETE = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { deviceId } = await req.json();
    await disconnectGoogleAccount(userId, deviceId);
    return NextResponse.json({ message: "Google account successfully unlinked." }, { status: 200 });
});
