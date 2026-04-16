import crypto from "crypto";
import User from "@/db/models/User";
import type { UserDocument, UserDTO } from "@/types/models/user";
import type { UpdateUserData } from "@/types/models/user";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { generateSignedUrl } from "@/lib/integrations/storage";

const CONNECT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Throttle lastOnline writes — only update if more than this many ms have passed
const LAST_ONLINE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function getUserById(userId: string): Promise<UserDocument> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
}

/**
 * Resolve a user's avatar key into a presigned URL. Returns null if no avatar.
 */
export async function resolveAvatarUrl(avatarKey?: string | null): Promise<string | null> {
    if (!avatarKey) return null;
    try {
        const { url } = await generateSignedUrl(avatarKey, 60 * 60);
        return url;
    } catch {
        return null;
    }
}

/**
 * Returns the user as a DTO with the avatar resolved to a presigned URL.
 */
export async function getUserDTOById(userId: string): Promise<UserDTO> {
    const user = await getUserById(userId);
    const obj = user.toObject();
    const avatarUrl = await resolveAvatarUrl(obj.avatar);
    return { ...obj, avatarUrl: avatarUrl ?? undefined } as unknown as UserDTO;
}

export async function createDeviceUser(deviceId: string, username: string): Promise<UserDocument> {
    if (!deviceId || !username) {
        throw new ValidationError("Device ID and username are required");
    }

    const existingUser = await User.findOne({ deviceId });
    if (existingUser) {
        throw new ConflictError("User with this device ID already exists");
    }

    const newUser = new User({ username, deviceId });
    await newUser.save();
    return newUser;
}

/**
 * Update allowed user fields. Only accepts allowlisted fields via UpdateUserData.
 */
export async function updateUser(userId: string, data: UpdateUserData): Promise<UserDocument> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    if (data.username !== undefined) {
        set.username = data.username;
    }
    if (data.avatar !== undefined) {
        if (data.avatar === null || data.avatar === "") {
            unset.avatar = "";
        } else {
            set.avatar = data.avatar;
        }
    }
    if (data.onboardingCompleted !== undefined) {
        set.onboardingCompleted = data.onboardingCompleted;
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!updatedUser) throw new NotFoundError("User not found");
    return updatedUser;
}

/**
 * Update the user's lastOnline timestamp. Throttled — skips the write if the
 * stored timestamp is recent enough.
 */
export async function touchLastOnline(userId: string): Promise<void> {
    const user = await User.findById(userId).select("lastOnline");
    if (!user) throw new NotFoundError("User not found");

    const now = Date.now();
    const last = user.lastOnline ? user.lastOnline.getTime() : 0;
    if (now - last < LAST_ONLINE_THROTTLE_MS) return;

    user.lastOnline = new Date(now);
    await user.save();
}

export async function registerPushToken(
    userId: string,
    token: string
): Promise<{ alreadyRegistered: boolean }> {
    if (!token) throw new ValidationError("Token is required");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if (user.fcmToken === token) {
        return { alreadyRegistered: true };
    }

    user.fcmToken = token;
    await user.save();
    return { alreadyRegistered: false };
}

export async function unregisterPushToken(userId: string, token: string): Promise<void> {
    if (!token) throw new ValidationError("Token is required");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    user.fcmToken = undefined;
    await user.save();
}

/**
 * Generate a short-lived connect token for the authenticated device user.
 * Used to securely link a Google account without exposing deviceId.
 */
export async function generateConnectToken(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (!user.deviceId)
        throw new ValidationError("Only device-authenticated users can generate a connect token");

    const token = crypto.randomUUID();
    user.connectToken = token;
    user.connectTokenExpiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_MS);
    await user.save();
    return token;
}

/**
 * Unlink a Google account from a user, re-establishing device auth.
 */
export async function disconnectGoogleAccount(userId: string, deviceId: string): Promise<void> {
    if (!deviceId) throw new ValidationError("No deviceId provided");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    user.deviceId = deviceId;
    user.googleId = undefined;
    user.googleConnected = false;
    await user.save();
}
