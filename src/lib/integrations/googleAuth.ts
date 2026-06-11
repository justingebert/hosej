import { OAuth2Client } from "google-auth-library";
import { env } from "@/env";
import { AuthError } from "@/lib/api/errorHandling";

const client = new OAuth2Client();

export type GoogleIdentity = { googleId: string; name?: string; email?: string };

/**
 * Verify a Google ID token issued to one of our OAuth clients (web + native).
 * Checks signature, issuer, expiry, and audience. Throws AuthError on any
 * failure. Lives behind this thin module so tests can mock it via
 * `@/lib/integrations/googleAuth`.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    const audience = [env.AUTH_GOOGLE_ID, ...(env.GOOGLE_MOBILE_CLIENT_IDS ?? [])];
    try {
        const ticket = await client.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload?.sub) throw new AuthError("Invalid Google token");
        return { googleId: payload.sub, name: payload.name, email: payload.email };
    } catch (err) {
        if (err instanceof AuthError) throw err;
        throw new AuthError("Invalid Google token");
    }
}
