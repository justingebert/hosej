import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { parseBody } from "@/lib/validation/parseBody";
import { GoogleIdTokenSchema } from "@/lib/validation/users";
import { verifyGoogleIdToken } from "@/lib/integrations/googleAuth";
import { linkGoogleToUser, issueMobileAuthBody } from "@/lib/services/user/user";

// POST /api/auth/mobile/google/link — link Google to the authenticated device account.
// Clears the device credential (Google becomes the sole identity), so the client MUST
// wipe its stored deviceId on success. Returns a fresh token reflecting the linked state.
export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { idToken } = await parseBody(req, GoogleIdTokenSchema);
    const identity = await verifyGoogleIdToken(idToken);
    const user = await linkGoogleToUser(userId, identity.googleId);
    return NextResponse.json(await issueMobileAuthBody(user), { status: 200 });
});
