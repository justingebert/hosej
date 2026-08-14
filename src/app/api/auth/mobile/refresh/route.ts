import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { MobileRefreshSchema } from "@/lib/validation/users";
import { refreshMobileAuthBody } from "@/lib/services/user/user";

// POST /api/auth/mobile/refresh — mint a fresh short-lived access token from an
// opaque refresh token. The app calls this on launch and after a 401. Idempotent:
// the refresh token doesn't rotate, so retrying a lost response is safe.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { refreshToken } = await parseBody(req, MobileRefreshSchema);
    return NextResponse.json(await refreshMobileAuthBody(refreshToken), { status: 200 });
});
