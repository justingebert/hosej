import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getUserById } from "@/lib/services/user/user";
import { buildMobileAuthBody } from "@/lib/auth/mobileToken";

// POST /api/auth/mobile/refresh — re-mint a fresh token (re-reads groups etc.) for the
// authenticated user. The app calls this on launch to roll the token's expiry forward.
export const POST = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const user = await getUserById(userId);
    return NextResponse.json(await buildMobileAuthBody(user), { status: 200 });
});
