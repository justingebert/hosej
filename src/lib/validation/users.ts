import { z } from "zod";
import { NOTIFICATION_LANGUAGES, NOTIFICATION_STYLES } from "@/types/models/user";

export const CreateDeviceUserSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
    userName: z.string().min(1, "userName is required").max(50),
});

export const DeviceLoginSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
});

export const GoogleIdTokenSchema = z.object({
    idToken: z.string().min(1, "idToken is required"),
});

const NotificationPrefsSchema = z
    .object({
        questionUnanswered: z.boolean(),
        rallySubmitDeadline: z.boolean(),
        rallyVoteDeadline: z.boolean(),
        rallyFirstSubmission: z.boolean(),
        jukeboxSubmit: z.boolean(),
        jukeboxRate: z.boolean(),
    })
    .partial();

export const UpdateUserSchema = z.object({
    username: z.string().min(1, "username is required").max(50).optional(),
    avatar: z.string().max(500).nullable().optional(),
    onboardingCompleted: z.boolean().optional(),
    announcementsSeen: z.array(z.string().min(1).max(100)).max(500).optional(),
    notificationLanguage: z.enum(NOTIFICATION_LANGUAGES).optional(),
    notificationStyle: z.enum(NOTIFICATION_STYLES).optional(),
    notificationPrefs: NotificationPrefsSchema.optional(),
});

export const GoogleDisconnectSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
});

export const PushTokenSchema = z.object({
    token: z.string().min(1, "token is required"),
});
