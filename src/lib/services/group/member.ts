import Group from "@/db/models/Group";
import User from "@/db/models/User";
import type { Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { GroupDocument, IGroup, IGroupMember } from "@/types/models/group";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";
import { isUserInGroup } from "./group";

// ─── Members ─────────────────────────────────────────────────

export async function getGroupMembers(userId: string, groupId: string) {
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId).populate({ path: "members", model: User });
    if (!group) throw new NotFoundError("Group not found");
    return group.members;
}

/**
 * Join a group. Adds user to Group.members and groupId to User.groups.
 * TODO: Add transaction when replica set is available.
 */
export async function joinGroup(
    userId: string,
    groupId: string
): Promise<{ group: GroupDocument; username: string }> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const isMember = group.members.some(
        (member: IGroupMember) => member.user.toString() === userId
    );
    if (isMember) {
        throw new ConflictError("User is already a member of this group");
    }

    group.members.push({ user: user._id, name: user.username } as IGroupMember);
    await group.save();

    if (!user.groups.includes(groupId)) {
        user.groups.push(groupId);
        await user.save();
    }

    return { group, username: user.username };
}

/**
 * Remove a member from a group. Handles:
 * - Self-leave (any member)
 * - Admin kick (admin only)
 * - Admin transfer if admin leaves
 * - Group deletion if last member leaves
 * TODO: Add transaction when replica set is available.
 */
export async function removeMember(
    userId: string,
    groupId: string,
    memberId: string
): Promise<{ deleted: boolean; group?: GroupDocument }> {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, group);

    const member = await User.findById(memberId);
    const user = await User.findById(userId);
    if (!member || !user) throw new NotFoundError("User or group not found");

    if (userId !== memberId && !group.admin.equals(user._id)) {
        throw new ForbiddenError("You are not the admin of this group");
    }

    group.members = group.members.filter(
        (m: IGroup["members"][number]) => m.user.toString() !== memberId
    );

    // Admin transfer if the leaving user is admin
    if (group.admin.equals(user._id) && group.members.length > 0) {
        const newAdmin = group.members.sort(
            (a, b) => a?.joinedAt?.getTime() - b?.joinedAt?.getTime()
        )[0];
        group.admin = newAdmin.user;
    }
    await group.save();

    member.groups = member.groups.filter((g) => g !== groupId);
    await member.save();

    if (group.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
        return { deleted: true };
    }

    return { deleted: false, group };
}

// ─── Points ──────────────────────────────────────────────────

/**
 * Calculates and updates streak for a member based on their participation.
 * - Streak increments if points were given yesterday
 * - Streak stays same if points already given today
 * - Streak continues if no questions were available
 * - Streak resets to 1 otherwise
 */
function calculateStreak(
    member: IGroupMember,
    today: Date,
    yesterday: Date,
    lastQuestionDate: Date | null
): number {
    const normalizedLastQuestionDate = lastQuestionDate
        ? new Date(new Date(lastQuestionDate).setHours(0, 0, 0, 0))
        : new Date(0);

    if (member.lastPointDate && member.lastPointDate.toDateString() === yesterday.toDateString()) {
        // Increment streak if last points were given yesterday
        return member.streak + 1;
    }

    if (member.lastPointDate && member.lastPointDate.toDateString() === today.toDateString()) {
        // If points were already added today, do nothing to the streak
        return member.streak;
    }

    if (
        !lastQuestionDate ||
        (normalizedLastQuestionDate <= yesterday &&
            member.lastPointDate?.toDateString() === normalizedLastQuestionDate.toDateString())
    ) {
        // No questions available, continue the streak
        return member.streak + 1;
    }

    // Reset streak
    return 1;
}

/**
 * Adds points to a group member and updates their streak.
 * This function modifies the group document and saves it.
 *
 * @param group - The group document (must be a Mongoose document with save())
 * @param userId - The user ID to add points to
 * @param points - Number of points to add
 * @throws Error if member is not found in group
 */
export async function addPointsToMember(
    group: HydratedDocument<IGroup>,
    userId: string | Types.ObjectId,
    points: number
): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastQuestionDate = group.features.questions.settings.lastQuestionDate;

    const memberEntry = group.members.find(
        (member: IGroupMember) => member.user.toString() === userId.toString()
    );

    if (!memberEntry) {
        throw new Error("Member not found in group");
    }

    memberEntry.points += points;
    memberEntry.streak = calculateStreak(memberEntry, today, yesterday, lastQuestionDate);
    memberEntry.lastPointDate = today;

    await group.save();
}
