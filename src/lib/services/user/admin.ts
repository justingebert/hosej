import dbConnect from "@/db/dbConnect";
import AppConfig from "@/db/models/AppConfig";
import type { Types } from "mongoose";
import type { IAppConfig, AppConfigDocument } from "@/types/models/appConfig";
import { NotFoundError } from "@/lib/api/errorHandling";

/**
 * Check if a user is a global admin
 */
export async function isGlobalAdmin(userId: string | Types.ObjectId): Promise<boolean> {
    await dbConnect();

    const config = await AppConfig.findOne({ configKey: "global_features" });
    if (!config) return false;

    return config.adminUsers.some(
        (adminId: Types.ObjectId) => adminId.toString() === userId.toString()
    );
}

/**
 * Get global feature config
 */
export async function getGlobalConfig() {
    await dbConnect();

    return await AppConfig.findOne({ configKey: "global_features" }).orFail();
}

export async function updateGlobalConfig(updates: {
    features?: Partial<IAppConfig["features"]>;
}): Promise<AppConfigDocument> {
    await dbConnect();

    const config = await AppConfig.findOne({ configKey: "global_features" });
    if (!config) throw new NotFoundError("Config not found");

    if (updates.features) {
        config.features = { ...config.features, ...updates.features };
    }

    await config.save();
    return config;
}
