import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { MobileRefreshSchema } from "@/lib/validation/users";
import { getUserByMobileRefreshToken, issueMobileAuthBody } from "@/lib/services/user/user";

// POST /api/auth/mobile/refresh — rotate an opaque refresh token and mint a
// fresh short-lived access token. The app calls this on launch and after 401.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { refreshToken } = await parseBody(req, MobileRefreshSchema);
    const user = await getUserByMobileRefreshToken(refreshToken);
    return NextResponse.json(await issueMobileAuthBody(user), { status: 200 });
});
