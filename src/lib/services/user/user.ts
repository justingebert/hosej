import crypto from "crypto";
import type { JWT } from "next-auth/jwt";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";
import Jukebox from "@/db/models/Jukebox";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import User from "@/db/models/User";
import type { UserDocument, UserDTO } from "@/types/models/user";
import type { UpdateUserData } from "@/types/models/user";
import type { IGroupMember } from "@/types/models/group";
import { AuthError, ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { generateSignedUrl } from "@/lib/integrations/storage";
import {
    generateMobileRefreshToken,
    hashMobileRefreshToken,
    buildMobileAuthBody,
    MOBILE_REFRESH_TOKEN_TTL_MS,
} from "@/lib/auth/mobileToken";
import { hashDeviceId, isValidDeviceId, normalizeDeviceId } from "@/lib/auth/deviceCredential";
import { deleteAllPushTokensForUser } from "@/lib/services/pushToken";

const CONNECT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_MOBILE_REFRESH_TOKENS = 5;
const DELETED_USER_SUFFIX = " (deleted)";

// Throttle lastOnline writes — only update if more than this many ms have passed
const LAST_ONLINE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

function requireValidDeviceId(deviceId: string): string {
    const normalized = normalizeDeviceId(deviceId);
    if (!isValidDeviceId(normalized)) {
        throw new ValidationError("deviceId must be a valid UUID");
    }
    return normalized;
}

function hasDeviceCredential(user: Pick<UserDocument, "deviceId" | "deviceIdHash">): boolean {
    return Boolean(user.deviceIdHash || user.deviceId);
}

function invalidateMobileSessions(user: UserDocument): void {
    user.mobileSessionVersion = (user.mobileSessionVersion ?? 0) + 1;
    user.mobileRefreshTokens = [];
}

function deletedUsername(username: string): string {
    return username.endsWith(DELETED_USER_SUFFIX) ? username : `${username}${DELETED_USER_SUFFIX}`;
}

async function migrateLegacyDeviceCredential(
    user: UserDocument,
    deviceId: string,
    deviceIdHash: string
): Promise<void> {
    if (!user.deviceId || user.deviceIdHash) return;
    if (normalizeDeviceId(user.deviceId) !== deviceId) return;

    user.deviceIdHash = deviceIdHash;
    user.deviceId = undefined;
    await user.save();
}

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
    const avatarUrl = await resolveAvatarUrl(user.avatar);
    return { ...user.toJSON(), avatarUrl: avatarUrl ?? undefined } as unknown as UserDTO;
}

export async function createDeviceUser(deviceId: string, username?: string): Promise<UserDocument> {
    const normalizedDeviceId = requireValidDeviceId(deviceId);
    // An omitted name is allowed (mobile "start without account") and falls back
    // to the "New user" placeholder; an explicit empty string is still rejected.
    if (username !== undefined && !username.trim()) {
        throw new ValidationError("username must not be empty");
    }
    const deviceIdHash = hashDeviceId(normalizedDeviceId);

    const existingUser = await User.findOne({
        $or: [{ deviceIdHash }, { deviceId: normalizedDeviceId }],
    });
    if (existingUser) {
        throw new ConflictError("User with this device ID already exists");
    }

    const newUser = new User({ username: username?.trim() || "New user", deviceIdHash });
    await newUser.save();
    return newUser;
}

/**
 * Find a device account by raw deviceId, matching either the hashed credential or
 * a legacy plaintext one and migrating the latter to a hash on hit. Returns null
 * when no account matches. Shared by mobile sign-in and the NextAuth device authorize.
 */
export async function findDeviceUser(deviceId: string): Promise<UserDocument | null> {
    const normalizedDeviceId = requireValidDeviceId(deviceId);
    const deviceIdHash = hashDeviceId(normalizedDeviceId);
    const user = await User.findOne({
        $or: [{ deviceIdHash }, { deviceId: normalizedDeviceId }],
    });
    if (!user) return null;
    await migrateLegacyDeviceCredential(user, normalizedDeviceId, deviceIdHash);
    return user;
}

/**
 * Look up an existing device account for mobile sign-in. Throws NotFoundError
 * when the deviceId is unknown — never creates (creation is createDeviceUser).
 */
export async function getUserByDeviceId(deviceId: string): Promise<UserDocument> {
    const user = await findDeviceUser(deviceId);
    if (!user) throw new NotFoundError("No account found for this device");
    return user;
}

export async function issueMobileAuthBody(
    user: UserDocument,
    // Derived from the placeholder so the hint survives every path (register,
    // login, refresh, 409-retry): the app keeps prompting for a real name until
    // one is set. Callers (e.g. Google sign-up) can still pass an explicit value.
    needsNameSetup = user.username === "New user"
) {
    const now = Date.now();
    const refreshToken = generateMobileRefreshToken();
    const tokenHash = hashMobileRefreshToken(refreshToken);
    const unexpiredTokens = (user.mobileRefreshTokens ?? []).filter(
        (token) => token.expiresAt.getTime() > now
    );

    user.mobileRefreshTokens = [
        ...unexpiredTokens.slice(-(MAX_MOBILE_REFRESH_TOKENS - 1)),
        {
            tokenHash,
            expiresAt: new Date(now + MOBILE_REFRESH_TOKEN_TTL_MS),
            createdAt: new Date(now),
        },
    ];
    await user.save();

    return buildMobileAuthBody(user, { refreshToken, needsNameSetup });
}

export async function getUserByMobileRefreshToken(refreshToken: string): Promise<UserDocument> {
    const tokenHash = hashMobileRefreshToken(refreshToken);
    const now = new Date();
    const user = await User.findOne({
        mobileRefreshTokens: {
            $elemMatch: {
                tokenHash,
                expiresAt: { $gt: now },
            },
        },
    });
    if (!user) throw new AuthError("Invalid refresh token");

    const nowMs = now.getTime();
    user.mobileRefreshTokens = (user.mobileRefreshTokens ?? []).filter(
        (token) => token.tokenHash !== tokenHash && token.expiresAt.getTime() > nowMs
    );
    return user;
}

/**
 * Revoke a single mobile refresh token (sign out on one device). Idempotent — a
 * no-op when the token is unknown, so it never reveals whether it existed. The
 * matching access token is left to expire on its own (≤15 min).
 */
export async function revokeMobileRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashMobileRefreshToken(refreshToken);
    await User.updateOne(
        { "mobileRefreshTokens.tokenHash": tokenHash },
        { $pull: { mobileRefreshTokens: { tokenHash } } }
    );
}

export async function assertValidMobileAccessToken(token: JWT): Promise<void> {
    const userId = token.userId ? String(token.userId) : "";
    const tokenVersion = token.mobileSessionVersion;
    if (!userId || !Number.isInteger(tokenVersion)) {
        throw new AuthError("Unauthorized");
    }

    const user = await User.findById(userId).select("deletedAt mobileSessionVersion").lean();
    if (!user || user.deletedAt || (user.mobileSessionVersion ?? 0) !== tokenVersion) {
        throw new AuthError("Unauthorized");
    }
}

export async function assertActiveUser(userId: string): Promise<void> {
    const user = await User.findById(userId).select("deletedAt").lean();
    if (!user || user.deletedAt) throw new AuthError("Unauthorized");
}

/**
 * Find a user by Google ID, or create a fresh Google account. Used by the mobile
 * Google sign-in endpoint. (The web flow handles this inline in the jwt callback,
 * where it also runs the cookie-based device-link merge that mobile doesn't use.)
 */
export async function findOrCreateGoogleUser(
    googleId: string,
    name?: string
): Promise<{ user: UserDocument; isNew: boolean }> {
    const existing = await User.findOne({ googleId });
    if (existing) return { user: existing, isNew: false };
    const user = new User({
        googleId,
        googleConnected: true,
        username: name?.trim() || "New user",
    });
    await user.save();
    return { user, isNew: true };
}

/**
 * Link a Google account to an already-authenticated user (mobile connect flow).
 * Clears the device credential so Google becomes the sole identity — the client
 * must also wipe its stored deviceId. Throws ConflictError if the Google account
 * already belongs to a different user.
 */
export async function linkGoogleToUser(userId: string, googleId: string): Promise<UserDocument> {
    const owner = await User.findOne({ googleId });
    if (owner && owner._id.toString() !== userId) {
        throw new ConflictError("This Google account is already linked to another user");
    }
    const user = await getUserById(userId);
    if (!hasDeviceCredential(user)) {
        throw new ValidationError("Only device accounts can link Google");
    }
    if (user.googleId || user.googleConnected) {
        throw new ConflictError("This account is already linked to Google");
    }

    invalidateMobileSessions(user);
    user.googleId = googleId;
    user.googleConnected = true;
    user.deviceId = undefined;
    user.deviceIdHash = undefined;
    user.connectToken = undefined;
    user.connectTokenExpiresAt = undefined;
    await user.save();
    return user;
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
    if (data.notificationLanguage !== undefined) {
        set.notificationLanguage = data.notificationLanguage;
    }
    if (data.notificationStyle !== undefined) {
        set.notificationStyle = data.notificationStyle;
    }
    if (data.notificationPrefs !== undefined) {
        // Dot-path merge so partial updates don't clobber sibling toggles.
        for (const [key, value] of Object.entries(data.notificationPrefs)) {
            if (value !== undefined) {
                set[`notificationPrefs.${key}`] = value;
            }
        }
    }
    const addToSet: Record<string, unknown> = {};
    if (data.announcementsSeen !== undefined) {
        const unique = Array.from(new Set(data.announcementsSeen));
        if (unique.length > 0) {
            addToSet.announcementsSeen = { $each: unique };
        }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;
    if (Object.keys(addToSet).length > 0) update.$addToSet = addToSet;

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!updatedUser) throw new NotFoundError("User not found");
    return updatedUser;
}

/**
 * Delete the user's account without deleting the document. Historical documents
 * can still populate this _id, but credentials and personal fields are removed.
 * Live group memberships are removed; solo groups are deleted with child content.
 */
export async function deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const groups = await Group.find({ "members.user": user._id });
    const deletedGroupIds = [];

    for (const group of groups) {
        const remainingMembers = group.members.filter(
            (member: IGroupMember) => member.user.toString() !== userId
        );

        if (remainingMembers.length === 0) {
            deletedGroupIds.push(group._id);
            await Group.findByIdAndDelete(group._id);
            await Chat.deleteMany({ group: group._id });
            await Jukebox.deleteMany({ group: group._id });
            await Question.deleteMany({ groupId: group._id });
            await Rally.deleteMany({ groupId: group._id });
            continue;
        }

        group.members = remainingMembers;
        if (group.admin.equals(user._id)) {
            const [newAdmin] = [...remainingMembers].sort(
                (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
            );
            group.admin = newAdmin.user;
        }
        await group.save();
    }

    if (deletedGroupIds.length > 0) {
        await User.updateMany(
            { _id: { $ne: user._id } },
            { $pull: { groups: { $in: deletedGroupIds } } }
        );
    }

    invalidateMobileSessions(user);
    await deleteAllPushTokensForUser(userId);
    user.username = deletedUsername(user.username);
    user.groups = [];
    user.avatar = undefined;
    user.lastOnline = undefined;
    user.announcementsSeen = [];
    user.onboardingCompleted = false;
    user.googleConnected = false;
    user.googleId = undefined;
    user.deviceId = undefined;
    user.deviceIdHash = undefined;
    user.fcmToken = undefined;
    user.connectToken = undefined;
    user.connectTokenExpiresAt = undefined;
    user.deletedAt = new Date();
    await user.save();
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
    if (!hasDeviceCredential(user))
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
    const normalizedDeviceId = requireValidDeviceId(deviceId);
    const deviceIdHash = hashDeviceId(normalizedDeviceId);

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (!user.googleId && !user.googleConnected) {
        throw new ValidationError("No Google account linked");
    }

    invalidateMobileSessions(user);
    user.deviceId = undefined;
    user.deviceIdHash = deviceIdHash;
    user.googleId = undefined;
    user.googleConnected = false;
    try {
        await user.save();
    } catch (err) {
        if ((err as { code?: number }).code === 11000) {
            throw new ConflictError("This device is already linked to another account");
        }
        throw err;
    }
}
