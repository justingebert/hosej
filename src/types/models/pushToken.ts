import type { HydratedDocument, Types } from "mongoose";

export const PUSH_PLATFORMS = ["ios", "android"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/**
 * An Expo push token belonging to a device. Keyed by the token string (unique) so
 * token rotation, shared-device re-login (userId flips), and multi-device all
 * collapse to one row. Separate from the legacy single `User.fcmToken` (web FCM),
 * which stays frozen until web is deprecated.
 */
export interface IPushToken {
    _id: Types.ObjectId;
    token: string;
    userId: Types.ObjectId;
    platform: PushPlatform;
    createdAt: Date;
    lastSeenAt: Date;
}

export type PushTokenDocument = HydratedDocument<IPushToken>;
