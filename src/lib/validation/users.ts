import { z } from "zod";

export const CreateDeviceUserSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
    userName: z.string().min(1, "userName is required").max(50),
});

export const UpdateUserSchema = z.object({
    username: z.string().min(1, "username is required").max(50).optional(),
    avatar: z.string().max(500).nullable().optional(),
    onboardingCompleted: z.boolean().optional(),
});

export const GoogleDisconnectSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
});

export const PushTokenSchema = z.object({
    token: z.string().min(1, "token is required"),
});
