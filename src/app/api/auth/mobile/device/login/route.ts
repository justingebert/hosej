import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { DeviceLoginSchema } from "@/lib/validation/users";
import { getUserByDeviceId, issueMobileAuthBody } from "@/lib/services/user/user";

// POST /api/auth/mobile/device/login — sign in to an existing device account.
// 404 if the deviceId is unknown (never creates — see register). Rate-limited by proxy.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { deviceId } = await parseBody(req, DeviceLoginSchema);
    const user = await getUserByDeviceId(deviceId);
    return NextResponse.json(await issueMobileAuthBody(user), { status: 200 });
});
