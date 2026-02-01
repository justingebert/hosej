import dbConnect from "../db/dbConnect";
import Group from "@/db/models/Group";
import { ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";
import AppConfig from "@/db/models/AppConfig";
import type { Types } from "mongoose";

export async function isUserInGroup(userId: string, groupId: string) {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some((member: any) => member.user.toString() === userId);

    if (!isMember) {
        throw new ForbiddenError("You are not a member of this group");
    }

    return { isAuthorized: true };
}

export async function isUserAdmin(userId: string, groupId: string) {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found");
    }

    const isAdmin = group.admin.toString() === userId.toString();
    if (!isAdmin) {
        throw new ForbiddenError("You are not an admin of this group");
    }
}

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
