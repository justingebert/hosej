import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { parseBody } from "@/lib/validation/parseBody";
import { GoogleIdTokenSchema } from "@/lib/validation/users";
import { verifyGoogleIdToken } from "@/lib/integrations/googleAuth";
import { findOrCreateGoogleUser, issueMobileAuthBody } from "@/lib/services/user/user";

// POST /api/auth/mobile/google — sign in or sign up with a Google ID token obtained
// natively by the app (expo-auth-session). Verifies the token server-side, then
// finds-or-creates the user by Google ID. Rate-limited by the proxy authLimiter.
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { idToken } = await parseBody(req, GoogleIdTokenSchema);
    const identity = await verifyGoogleIdToken(idToken);
    const { user, isNew } = await findOrCreateGoogleUser(identity.googleId, identity.name);
    return NextResponse.json(await issueMobileAuthBody(user, isNew), { status: 200 });
});
