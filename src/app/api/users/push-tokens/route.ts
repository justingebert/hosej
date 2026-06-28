import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { registerExpoPushToken, unregisterExpoPushToken } from "@/lib/services/pushToken";
import { parseBody } from "@/lib/validation/parseBody";
import { RegisterPushTokenSchema, UnregisterPushTokenSchema } from "@/lib/validation/users";

// New Expo-push token collection (mobile). The singular /api/users/push-token route
// stays frozen for the legacy web FCM path.
export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { token, platform } = await parseBody(req, RegisterPushTokenSchema);
    await registerExpoPushToken(userId, token, platform);
    return NextResponse.json({ message: "Push token registered" }, { status: 200 });
});

export const DELETE = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { token } = await parseBody(req, UnregisterPushTokenSchema);
    await unregisterExpoPushToken(userId, token);
    return NextResponse.json({ message: "Push token unregistered" }, { status: 200 });
});
