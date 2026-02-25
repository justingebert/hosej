import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { registerPushToken, unregisterPushToken } from "@/lib/services/user/user";
import { parseBody } from "@/lib/validation/parseBody";
import { PushTokenSchema } from "@/lib/validation/users";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { token } = await parseBody(req, PushTokenSchema);
    const { alreadyRegistered } = await registerPushToken(userId, token);
    return NextResponse.json(
        { message: alreadyRegistered ? "Token already exists" : "Token registered successfully" },
        { status: alreadyRegistered ? 200 : 201 }
    );
});

export const DELETE = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { token } = await parseBody(req, PushTokenSchema);
    await unregisterPushToken(userId, token);
    return NextResponse.json({ message: "FCM token unregistered successfully." }, { status: 200 });
});
