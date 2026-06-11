import { encode, decode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { env } from "@/env";

/**
 * Mobile (Expo) clients can't use NextAuth's cookie session, so we hand them a
 * Bearer token instead. It's the same encrypted NextAuth JWT, just minted with a
 * fixed salt (rather than the env-dependent cookie name NextAuth uses) so it
 * decodes identically in every environment. Read back via `decodeMobileToken`
 * (and, for requests, `getAuthToken`).
 */
export const MOBILE_TOKEN_SALT = "hosej-mobile-session";
export const MOBILE_TOKEN_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Minimal shape needed to build claims — satisfied by a User document or a lean object. */
type UserLike = {
    _id: { toString(): string };
    username: string;
    googleConnected?: boolean;
    groups?: Array<{ toString(): string }>;
    createdAt?: Date | string;
    onboardingCompleted?: boolean;
    announcementsSeen?: string[];
};

/** Build the JWT claim set from a user — mirrors the fields set by the web `jwt` callback. */
export function userTokenClaims(user: UserLike): JWT {
    return {
        userId: user._id.toString(),
        username: user.username,
        googleConnected: user.googleConnected ?? false,
        groups: (user.groups ?? []).map(String),
        createdAt: String(user.createdAt ?? ""),
        // Always false for mobile: the proxy redirects browser sessions flagged
        // needsNameSetup to /setup-name, which would break a native client. The
        // app reads the `needsNameSetup` hint from the auth response body instead.
        needsNameSetup: false,
        onboardingCompleted: user.onboardingCompleted ?? false,
        announcementsSeen: user.announcementsSeen ?? [],
    };
}

/** Compact user summary returned alongside the token in mobile auth responses. */
export function authUserSummary(user: UserLike) {
    return {
        id: user._id.toString(),
        username: user.username,
        googleConnected: user.googleConnected ?? false,
    };
}

export function mintMobileToken(claims: JWT): Promise<string> {
    return encode({
        token: claims,
        secret: env.NEXTAUTH_SECRET,
        salt: MOBILE_TOKEN_SALT,
        maxAge: MOBILE_TOKEN_MAX_AGE,
    });
}

export async function decodeMobileToken(token: string): Promise<JWT | null> {
    try {
        return await decode({ token, secret: env.NEXTAUTH_SECRET, salt: MOBILE_TOKEN_SALT });
    } catch {
        // Malformed, tampered, or expired token — treat as unauthenticated.
        return null;
    }
}

/**
 * Token + user summary body shared by every mobile auth endpoint. `needsNameSetup`
 * is a hint for the app to prompt for a display name (e.g. a fresh Google sign-up);
 * it's deliberately kept out of the token itself — see `userTokenClaims`.
 */
export async function buildMobileAuthBody(user: UserLike, needsNameSetup = false) {
    return {
        token: await mintMobileToken(userTokenClaims(user)),
        user: authUserSummary(user),
        needsNameSetup,
    };
}
