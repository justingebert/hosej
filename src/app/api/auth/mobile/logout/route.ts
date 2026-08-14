import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { MobileRefreshSchema } from "@/lib/validation/users";
import { revokeMobileSession } from "@/lib/services/user/mobileSession";

// POST /api/auth/mobile/logout — revoke a single session (sign out this device).
// Identified by the refresh token alone so it works even after the access token
// has expired. Idempotent: always 204, never reveals whether the token existed.
// Public + rate-limited by the proxy authLimiter.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { refreshToken } = await parseBody(req, MobileRefreshSchema);
    await revokeMobileSession(refreshToken);
    return new NextResponse(null, { status: 204 });
});
