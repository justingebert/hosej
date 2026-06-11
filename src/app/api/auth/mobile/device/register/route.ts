import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { CreateDeviceUserSchema } from "@/lib/validation/users";
import { createDeviceUser } from "@/lib/services/user/user";
import { buildMobileAuthBody } from "@/lib/auth/mobileToken";

// POST /api/auth/mobile/device/register — create a new device account, return a Bearer token.
// 409 if the deviceId already exists (mirrors the web create path; never silently re-creates,
// which would mint a ghost account on a stale deviceId). Rate-limited by the proxy authLimiter.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { deviceId, userName } = await parseBody(req, CreateDeviceUserSchema);
    const user = await createDeviceUser(deviceId, userName);
    return NextResponse.json(await buildMobileAuthBody(user), { status: 201 });
});
