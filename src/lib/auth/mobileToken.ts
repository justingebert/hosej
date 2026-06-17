import { encode, decode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import crypto from "crypto";
import { env } from "@/env";

/**
 * Mobile (Expo) clients can't use NextAuth's cookie session, so API calls use a
 * short-lived Bearer access token. Refresh tokens are opaque random secrets,
 * stored hashed on the user document and rotated via /api/auth/mobile/refresh.
 */
export const MOBILE_TOKEN_SALT = "hosej-mobile-session";
export const MOBILE_ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes
export const MOBILE_REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

/** Minimal shape needed to build claims — satisfied by a User document or a lean object. */
type UserLike = {
    _id: { toString(): string };
    username: string;
    googleConnected?: boolean;
    groups?: Array<{ toString(): string }>;
    createdAt?: Date | string;
    onboardingCompleted?: boolean;
    announcementsSeen?: string[];
    mobileSessionVersion?: number;
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
        // announcementsSeen is intentionally omitted from the access token: it can
        // grow unbounded and isn't read server-side — the app gets it from the user DTO.
        mobileSessionVersion: user.mobileSessionVersion ?? 0,
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
        token: JSON.parse(JSON.stringify(claims)) as JWT,
        secret: env.NEXTAUTH_SECRET,
        salt: MOBILE_TOKEN_SALT,
        maxAge: MOBILE_ACCESS_TOKEN_MAX_AGE,
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

export function generateMobileRefreshToken(): string {
    return crypto.randomBytes(32).toString("base64url");
}

export function hashMobileRefreshToken(refreshToken: string): string {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
}

/**
 * Access token + refresh token body shared by every mobile auth endpoint.
 * `needsNameSetup` is a hint for the app to prompt for a display name (e.g. a
 * fresh Google sign-up); it's deliberately kept out of the token itself — see
 * `userTokenClaims`.
 */
export async function buildMobileAuthBody(
    user: UserLike,
    {
        refreshToken,
        needsNameSetup = false,
    }: {
        refreshToken: string;
        needsNameSetup?: boolean;
    }
) {
    const accessToken = await mintMobileToken(userTokenClaims(user));
    return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: MOBILE_ACCESS_TOKEN_MAX_AGE,
        user: authUserSummary(user),
        needsNameSetup,
    };
}
