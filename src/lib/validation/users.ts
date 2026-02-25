import { z } from "zod";

export const CreateDeviceUserSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
    userName: z.string().min(1, "userName is required").max(50),
});

export const UpdateUserSchema = z.object({
    username: z.string().min(1, "username is required").max(50).optional(),
});

export const GoogleLinkSchema = z.object({
    deviceId: z.string().min(1, "deviceId is required"),
});

export const PushTokenSchema = z.object({
    token: z.string().min(1, "token is required"),
});
