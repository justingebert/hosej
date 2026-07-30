import AppConfig from "@/db/models/AppConfig";
import type { Types } from "mongoose";
import { isUserAdmin, isUserInGroup } from "@/lib/services/group";

/**
 * Check if a user is a global admin
 */
export async function isGlobalAdmin(userId: string | Types.ObjectId): Promise<boolean> {
    const config = await AppConfig.findOne({ configKey: "global_features" });
    if (!config) return false;

    return config.adminUsers.some(
        (adminId: Types.ObjectId) => adminId.toString() === userId.toString()
    );
}

/**
 * Checks group membership, but allows global admins to bypass.
 */
export async function assertGroupAccessOrGlobalAdmin(
    userId: string,
    groupId: string
): Promise<void> {
    const globalAdmin = await isGlobalAdmin(userId);
    if (globalAdmin) return;
    await isUserInGroup(userId, groupId);
}

/**
 * Checks group admin, but allows global admins to bypass.
 */
export async function assertGroupAdminOrGlobalAdmin(
    userId: string,
    groupId: string
): Promise<void> {
    const globalAdmin = await isGlobalAdmin(userId);
    if (globalAdmin) return;
    await isUserInGroup(userId, groupId);
    await isUserAdmin(userId, groupId);
}

/**
 * Get global feature config
 */
export async function getGlobalConfig() {
    return await AppConfig.findOne({ configKey: "global_features" }).orFail();
}
