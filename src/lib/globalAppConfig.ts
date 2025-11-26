import dbConnect from "@/lib/dbConnect";
import AppConfig from "@/db/models/AppConfig";
import { Types } from "mongoose";

/**
 * Check if a user is a global admin
 */
export async function isGlobalAdmin(userId: string | Types.ObjectId): Promise<boolean> {
    await dbConnect();

    const config = await AppConfig.findOne({ configKey: "global_features" });
    if (!config) return false;

    return config.adminUsers.some((adminId: Types.ObjectId) => adminId.toString() === userId.toString());
}

/**
 * Get global feature config
 */
export async function getGlobalConfig() {
    await dbConnect();

    return await AppConfig.findOne({ configKey: "global_features" }).orFail();
}

