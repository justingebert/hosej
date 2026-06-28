import PushToken from "@/db/models/PushToken";
import type { PushPlatform } from "@/types/models/pushToken";

/**
 * Upsert an Expo push token, (re)binding it to the given user. Keyed by the token
 * string, so a token that re-appears under a new user (shared device re-login) just
 * flips `userId`. Refreshes `lastSeenAt` on every call.
 */
export async function registerExpoPushToken(
    userId: string,
    token: string,
    platform: PushPlatform
): Promise<void> {
    await PushToken.findOneAndUpdate(
        { token },
        {
            $set: { userId, platform, lastSeenAt: new Date() },
            $setOnInsert: { token, createdAt: new Date() },
        },
        { upsert: true }
    );
}

/**
 * Remove a push token (e.g. on logout). Scoped to the owning user so one user can't
 * evict another's token. Idempotent.
 */
export async function unregisterExpoPushToken(userId: string, token: string): Promise<void> {
    await PushToken.deleteOne({ token, userId });
}

/**
 * Remove every push token belonging to a user. Called on account deletion so no
 * device of theirs keeps receiving pushes — covers all devices server-side,
 * unlike the single-device client logout cleanup.
 */
export async function deleteAllPushTokensForUser(userId: string): Promise<void> {
    await PushToken.deleteMany({ userId });
}
