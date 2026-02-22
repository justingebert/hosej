import { Types } from "mongoose";
import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import Chat from "@/db/models/Chat";
import type { GroupDocument, IGroup, IGroupMember, GroupStatsDTO } from "@/types/models/group";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { addTemplatePackToGroup, activateSmartQuestions } from "@/lib/services/question";

// ─── Authorization helpers ───────────────────────────────────

/**
 * Verify a user is a member of a group. Throws if not.
 * Accepts an optional pre-loaded group to avoid redundant DB calls.
 */
export async function isUserInGroup(
    userId: string,
    groupId: string,
    group?: GroupDocument | null
): Promise<{ isAuthorized: boolean }> {
    const g = group ?? (await Group.findById(groupId));
    if (!g) throw new NotFoundError("Group not found");

    const isMember = g.members.some((member: IGroupMember) => member.user.toString() === userId);
    if (!isMember) {
        throw new ForbiddenError("You are not a member of this group");
    }
    return { isAuthorized: true };
}

/**
 * Verify a user is the admin of a group. Throws if not.
 * Accepts an optional pre-loaded group to avoid redundant DB calls.
 */
export async function isUserAdmin(
    userId: string,
    groupId: string,
    group?: GroupDocument | null
): Promise<void> {
    const g = group ?? (await Group.findById(groupId));
    if (!g) throw new NotFoundError("Group not found");

    const isAdmin = g.admin.toString() === userId.toString();
    if (!isAdmin) {
        throw new ForbiddenError("You are not an admin of this group");
    }
}

// ─── Group CRUD ──────────────────────────────────────────────

export async function createGroup(userId: string, name: string): Promise<GroupDocument> {
    await dbConnect();

    if (!name) throw new ValidationError("Group name is required");

    const userAdmin = await User.findById(userId);
    if (!userAdmin) throw new NotFoundError("User not found");

    const member = { user: userAdmin._id, name: userAdmin.username };
    const newGroup = new Group({
        name,
        admin: userAdmin._id,
        members: [member],
    });
    await newGroup.save();

    userAdmin.groups.push(newGroup._id);
    await userAdmin.save();

    await addTemplatePackToGroup(newGroup._id, "starter-pack");
    await activateSmartQuestions(newGroup._id);

    return newGroup;
}

export async function getUserGroups(userId: string) {
    await dbConnect();
    const user = await User.findById(userId).populate({ path: "groups", model: Group });
    if (!user) throw new NotFoundError("User not found");
    return user.groups;
}

/**
 * Get a single group with a computed userIsAdmin flag.
 * Returns a plain object with the extra field, properly typed.
 */
export async function getGroupWithAdminFlag(
    userId: string,
    groupId: string
): Promise<IGroup & { userIsAdmin: boolean }> {
    await dbConnect();

    const groupDoc = await Group.findById(groupId);
    if (!groupDoc) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, groupDoc);

    const group = groupDoc.toObject();
    return { ...group, userIsAdmin: groupDoc.admin.equals(userId) };
}

export async function updateGroup(
    userId: string,
    groupId: string,
    data: Partial<IGroup>
): Promise<GroupDocument> {
    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, group);
    await isUserAdmin(userId, groupId, group);

    group.set(data);
    await group.save();
    return group;
}

/**
 * Delete a group (admin only).
 * Uses bulk $pull instead of looping users one by one.
 * TODO this should also delete all related documents (questions, rallies, chats)
 */
export async function deleteGroup(userId: string, groupId: string): Promise<void> {
    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, group);
    await isUserAdmin(userId, groupId, group);

    const memberUserIds = group.members.map((m: IGroupMember) => m.user);
    await User.updateMany({ _id: { $in: memberUserIds } }, { $pull: { groups: groupId } });

    await Group.findByIdAndDelete(groupId);
}

// ─── Stats ───────────────────────────────────────────────────

export async function getGroupStats(userId: string, groupId: string): Promise<GroupStatsDTO> {
    await dbConnect();
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const objectId = new Types.ObjectId(groupId);

    const [
        questionsUsedCount,
        questionsLeftCount,
        questionsByType,
        questionsByUser,
        RalliesUsedCount,
        RalliesLeftCount,
        messages,
    ] = await Promise.all([
        Question.countDocuments({ groupId, used: true }),
        Question.countDocuments({ groupId, used: false }),
        Question.aggregate([
            { $match: { groupId: objectId } },
            { $group: { _id: "$questionType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Question.aggregate([
            {
                $match: {
                    groupId: objectId,
                    submittedBy: { $exists: true, $ne: null },
                },
            },
            { $group: { _id: "$submittedBy", count: { $sum: 1 } } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $project: { _id: 0, username: "$user.username", count: 1 } },
            { $sort: { count: -1 } },
        ]),
        Rally.countDocuments({ groupId, used: true }),
        Rally.countDocuments({ groupId, used: false }),
        Chat.aggregate([
            { $match: { group: objectId } },
            { $unwind: "$messages" },
            { $count: "messagesCount" },
        ]),
    ]);

    return {
        group: group.toObject(),
        questionsUsedCount,
        questionsLeftCount,
        questionsByType,
        questionsByUser,
        RalliesUsedCount,
        RalliesLeftCount,
        messagesCount: messages[0]?.messagesCount || 0,
    };
}

// ─── History ─────────────────────────────────────────────────

export async function getGroupHistory(
    userId: string,
    groupId: string,
    limit: number,
    offset: number
) {
    await dbConnect();
    await isUserInGroup(userId, groupId);

    return Question.find({
        groupId,
        used: true,
        active: false,
    })
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
}
