import AppConfig from "@/db/models/AppConfig";
import type { Types } from "mongoose";
import type { AppConfigDocument, IAppConfig } from "@/types/models/appConfig";
import { NotFoundError } from "@/lib/api/errorHandling";
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

export async function updateGlobalConfig(updates: {
    features?: Partial<IAppConfig["features"]>;
}): Promise<AppConfigDocument> {
    const config = await AppConfig.findOne({ configKey: "global_features" });
    if (!config) throw new NotFoundError("Config not found");

    if (updates.features) {
        config.features = { ...config.features, ...updates.features };
    }

    await config.save();
    return config;
}
