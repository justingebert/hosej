import User from "@/db/models/User";
import type { UserDocument } from "@/types/models/user";
import type { UpdateUserData } from "@/types/models/user";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";

export async function getUserById(userId: string): Promise<UserDocument> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return user;
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
    const updatePayload: Partial<UpdateUserData> = {};
    if (data.username !== undefined) {
        updatePayload.username = data.username;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true });
    if (!updatedUser) throw new NotFoundError("User not found");
    return updatedUser;
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
 * Link a Google account to an existing device user.
 * Deletes the Google-only user, migrates googleId to the device user.
 * TODO: Add transaction when replica set is available.
 */
export async function connectGoogleAccount(googleUserId: string, deviceId: string): Promise<void> {
    if (!deviceId) throw new ValidationError("No deviceId provided");

    const googleUser = await User.findById(googleUserId);
    if (!googleUser) throw new NotFoundError("Google user not found");

    const deviceUser = await User.findOne({ deviceId });
    if (!deviceUser) throw new NotFoundError("User with deviceId not found");

    // Update device user FIRST (safer — if delete fails, orphan is harmless)
    deviceUser.googleId = googleUser.googleId;
    deviceUser.googleConnected = true;
    deviceUser.deviceId = undefined;
    await deviceUser.save();

    // Then clean up the temporary Google-only user
    await User.deleteOne({ _id: googleUserId });
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
