import type { Types } from "mongoose";
import User from "@/db/models/User";
import type { MobileRefreshToken, UserDocument } from "@/types/models/user";
import { AuthError } from "@/lib/api/errorHandling";
import {
    generateMobileRefreshToken,
    hashMobileRefreshToken,
    MOBILE_REFRESH_TOKEN_TTL_MS,
} from "@/lib/auth/mobileToken";

/**
 * One entry in `user.mobileRefreshTokens` per signed-in device.
 *
 * Refresh tokens deliberately do NOT rotate. Rotation made every refresh a
 * destructive write the client had to persist before it became usable, so a
 * response lost to a flaky connection signed the user out. Refreshing is now a
 * pure read — idempotent, and impossible to race. Don't reintroduce rotation
 * without solving that.
 *
 * A session ends by revocation (sign-out, or a credential change) or by expiry.
 */

export const MAX_MOBILE_SESSIONS_PER_USER = 10;

/** A session is identified by its token's hash: not a secret, just the lookup key. */
export type MobileSessionId = string;

type Rejection = "not_found" | "expired";

/** 401s stay opaque to the client; the reason is logged so logouts are diagnosable. */
function rejectSession(reason: Rejection, sessionId?: MobileSessionId): never {
    console.warn("[mobile-session] rejected", { reason, sessionId: sessionId?.slice(0, 8) });
    throw new AuthError("Unauthorized");
}

function rejectionFor(session: MobileRefreshToken | undefined, now: number): Rejection | null {
    if (!session) return "not_found";
    if (session.expiresAt.getTime() <= now) return "expired";
    return null;
}

/** Sign a device in. The raw refresh token exists outside the client only here. */
export async function createMobileSession(
    userId: Types.ObjectId
): Promise<{ refreshToken: string; sessionId: MobileSessionId }> {
    const refreshToken = generateMobileRefreshToken();
    const tokenHash = hashMobileRefreshToken(refreshToken);
    const now = new Date();

    // $push caps the array in the same atomic write, dropping the oldest device.
    await User.updateOne(
        { _id: userId },
        {
            $push: {
                mobileRefreshTokens: {
                    $each: [
                        {
                            tokenHash,
                            createdAt: now,
                            expiresAt: new Date(now.getTime() + MOBILE_REFRESH_TOKEN_TTL_MS),
                        },
                    ],
                    $sort: { createdAt: -1 },
                    $slice: MAX_MOBILE_SESSIONS_PER_USER,
                },
            },
        }
    );

    return { refreshToken, sessionId: tokenHash };
}

/** Resolve a refresh token to its owner. Read-only, so concurrent refreshes are a non-event. */
export async function resolveMobileSession(
    refreshToken: string
): Promise<{ user: UserDocument; sessionId: MobileSessionId }> {
    const tokenHash = hashMobileRefreshToken(refreshToken);
    const user = await User.findOne({
        "mobileRefreshTokens.tokenHash": tokenHash,
        deletedAt: null,
    });
    if (!user) rejectSession("not_found", tokenHash);

    const session = user.mobileRefreshTokens?.find((entry) => entry.tokenHash === tokenHash);
    const rejection = rejectionFor(session, Date.now());
    if (rejection) rejectSession(rejection, tokenHash);

    return { user, sessionId: tokenHash };
}

/** Per-request check behind every mobile Bearer token. One indexed read. */
export async function assertMobileSessionActive(
    sessionId: MobileSessionId,
    userId: string
): Promise<void> {
    const user = await User.findOne(
        { _id: userId, deletedAt: null },
        { mobileRefreshTokens: { $elemMatch: { tokenHash: sessionId } } }
    ).lean();
    if (!user) rejectSession("not_found", sessionId);

    const rejection = rejectionFor(user.mobileRefreshTokens?.[0], Date.now());
    if (rejection) rejectSession(rejection, sessionId);
}

/** Sign out one device. Idempotent, and silent about whether the token existed. */
export async function revokeMobileSession(refreshToken: string): Promise<void> {
    const tokenHash = hashMobileRefreshToken(refreshToken);
    await User.updateOne(
        { "mobileRefreshTokens.tokenHash": tokenHash },
        { $pull: { mobileRefreshTokens: { tokenHash } } }
    );
}

/** Sign out every device — for credential changes: Google linked/unlinked, account deleted. */
export async function revokeAllMobileSessions(userId: Types.ObjectId | string): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { mobileRefreshTokens: [] } });
}
