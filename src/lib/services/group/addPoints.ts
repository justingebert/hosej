import type { Types } from "mongoose";
import type { IGroup, IGroupMember } from "@/types/models/group";
import type { HydratedDocument } from "mongoose";

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
