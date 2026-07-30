import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

export const NOTIFICATION_LANGUAGES = ["en", "de"] as const;
export type NotificationLanguage = (typeof NOTIFICATION_LANGUAGES)[number];

export const NOTIFICATION_STYLES = ["default", "chaos"] as const;
export type NotificationStyle = (typeof NOTIFICATION_STYLES)[number];

export const DEFAULT_NOTIFICATION_LANGUAGE: NotificationLanguage = "en";
export const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = "default";

// Mobile push (Expo) opt-outs. Web FCM ignores these. Reminder/nag keys were
// removed with the reminders service — every remaining event is a real event.
export const NOTIFICATION_PREF_KEYS = [
    "questionNew",
    "jukeboxNew",
    "rallyNew",
    "chatMessage",
] as const;
export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];
export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
    questionNew: true,
    jukeboxNew: true,
    rallyNew: true,
    chatMessage: true,
};

export type MobileRefreshToken = {
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
};

export interface IUser {
    _id: Types.ObjectId;
    username: string;
    groups: (Types.ObjectId | string)[];

    deviceId?: string;
    deviceIdHash?: string;
    fcmToken?: string;
    googleConnected: boolean;
    googleId?: string;
    connectToken?: string;
    connectTokenExpiresAt?: Date;
    mobileSessionVersion?: number;
    mobileRefreshTokens?: MobileRefreshToken[];

    avatar?: string;
    lastOnline?: Date;
    deletedAt?: Date;
    onboardingCompleted?: boolean;
    announcementsSeen?: string[];

    notificationLanguage: NotificationLanguage;
    notificationStyle: NotificationStyle;
    notificationPrefs: NotificationPrefs;

    createdAt: Date;
}
export type UserDocument = HydratedDocument<IUser>;

export type UserDTO = ToDTO<IUser> & {
    avatarUrl?: string;
};

/** Fields that can be updated via PUT /users */
export interface UpdateUserData {
    username?: string;
    avatar?: string | null;
    onboardingCompleted?: boolean;
    announcementsSeen?: string[];
    notificationLanguage?: NotificationLanguage;
    notificationStyle?: NotificationStyle;
    notificationPrefs?: Partial<NotificationPrefs>;
}
