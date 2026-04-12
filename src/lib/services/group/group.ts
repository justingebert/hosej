import { Types } from "mongoose";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import { RallyStatus } from "@/types/models/rally";
import Chat from "@/db/models/Chat";
import Jukebox from "@/db/models/Jukebox";
import type {
    GroupDocument,
    IGroup,
    IGroupMember,
    GroupStatsDTO,
    UpdateGroupData,
} from "@/types/models/group";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { addTemplatePackToGroup, activateSmartQuestions } from "@/lib/services/question";
import { resolveAvatarUrl } from "@/lib/services/user/user";

/**
 * Enrich a list of group members with avatar/lastOnline pulled from the
 * User collection. Returns a new array — does not mutate the input.
 */
export async function enrichMembersWithUserData(
    members: IGroupMember[]
): Promise<Array<IGroupMember & { avatarUrl?: string; lastOnline?: Date }>> {
    if (members.length === 0) return [];
    const memberIds = members.map((m) => m.user);
    const users = await User.find({ _id: { $in: memberIds } }, { avatar: 1, lastOnline: 1 }).lean();

    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return Promise.all(
        members.map(async (m) => {
            const userInfo = userById.get(m.user.toString());
            const avatarUrl = userInfo?.avatar
                ? ((await resolveAvatarUrl(userInfo.avatar)) ?? undefined)
                : undefined;
            return {
                ...m,
                avatarUrl,
                lastOnline: userInfo?.lastOnline ?? undefined,
            };
        })
    );
}

// ─── Authorization helpers ───────────────────────────────────

/**
 * Verify a user is a member of a group. Throws if not.
 * Accepts an optional pre-loaded group to avoid redundant DB calls.
 */
export async function isUserInGroup(
    userId: string,
    groupId: string,
    group?: GroupDocument | null
): Promise<void> {
    const g = group ?? (await Group.findById(groupId));
    if (!g) throw new NotFoundError("Group not found");

    const isMember = g.members.some((member: IGroupMember) => member.user.toString() === userId);
    if (!isMember) {
        throw new ForbiddenError("User is not a member of this group");
    }
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

    await addTemplatePackToGroup(newGroup._id, "trade-off-v2");
    await activateSmartQuestions(newGroup._id);

    return newGroup;
}

export async function getUserGroups(userId: string) {
    const user = await User.findById(userId).populate({ path: "groups", model: Group });
    if (!user) throw new NotFoundError("User not found");
    return user.groups;
}

/**
 * Returns all groups (id + name + member count). Admin-only — caller must verify.
 */
export async function getAllGroups(): Promise<
    { _id: string; name: string; memberCount: number }[]
> {
    const groups = await Group.find({}, { name: 1, members: 1 }).lean();
    return groups.map((g) => ({
        _id: g._id.toString(),
        name: g.name,
        memberCount: g.members.length,
    }));
}

/**
 * Get a single group with a computed userIsAdmin flag.
 * Returns a plain object with the extra field, properly typed.
 * Members are enriched with avatar/lastOnline from the User collection.
 */
export async function getGroupWithAdminFlag(
    userId: string,
    groupId: string
): Promise<IGroup & { userIsAdmin: boolean }> {
    const groupDoc = await Group.findById(groupId);
    if (!groupDoc) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, groupDoc);

    const group = groupDoc.toObject();
    const enrichedMembers = await enrichMembersWithUserData(group.members);
    return {
        ...group,
        members: enrichedMembers as IGroupMember[],
        userIsAdmin: groupDoc.admin.equals(userId),
    };
}

export async function updateGroup(
    userId: string,
    groupId: string,
    data: UpdateGroupData
): Promise<GroupDocument> {
    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    await isUserInGroup(userId, groupId, group);
    await isUserAdmin(userId, groupId, group);

    if (data.name !== undefined) group.name = data.name;
    if (data.features !== undefined) group.set("features", { ...group.features, ...data.features });

    await group.save();
    return group;
}

/**
 * Delete a group (admin only).
 * Uses bulk $pull instead of looping users one by one.
 * TODO this should also delete all related documents (questions, rallies, chats)
 */
export async function deleteGroup(userId: string, groupId: string): Promise<void> {
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
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const objectId = new Types.ObjectId(groupId);

    const [
        questionsUsedCount,
        questionsLeftCount,
        questionsByType,
        questionsByUser,
        ralliesCompletedCount,
        ralliesCreatedCount,
        rallyWins,
        jukeboxStats,
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
        Rally.countDocuments({ groupId, status: RallyStatus.Completed }),
        Rally.countDocuments({ groupId, status: RallyStatus.Created }),
        // Rally wins: for each completed rally, find the submission with most votes
        Rally.aggregate([
            { $match: { groupId: objectId, status: RallyStatus.Completed } },
            { $unwind: "$submissions" },
            { $addFields: { voteCount: { $size: "$submissions.votes" } } },
            { $sort: { _id: 1, voteCount: -1 } },
            { $group: { _id: "$_id", winner: { $first: "$submissions" } } },
            { $group: { _id: "$winner.userId", wins: { $sum: 1 } } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $project: { _id: 0, username: "$user.username", wins: 1 } },
            { $sort: { wins: -1 } },
        ]),
        // Jukebox: total songs and average rating
        Jukebox.aggregate([
            { $match: { groupId: objectId } },
            { $unwind: "$songs" },
            { $unwind: { path: "$songs.ratings", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    songIds: { $addToSet: "$songs._id" },
                    avgRating: { $avg: "$songs.ratings.rating" },
                },
            },
            { $project: { _id: 0, songsCount: { $size: "$songIds" }, avgRating: 1 } },
        ]),
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
        ralliesCompletedCount,
        ralliesCreatedCount,
        rallyWins,
        jukeboxSongsCount: jukeboxStats[0]?.songsCount || 0,
        jukeboxAvgRating: Math.round((jukeboxStats[0]?.avgRating || 0) * 10) / 10,
        messagesCount: messages[0]?.messagesCount || 0,
    };
}

// ─── History ─────────────────────────────────────────────────

export async function getGroupHistory(
    userId: string,
    groupId: string,
    limit: number,
    offset: number,
    search?: string
) {
    await isUserInGroup(userId, groupId);

    const filter: Record<string, unknown> = {
        groupId,
        used: true,
        active: false,
    };

    if (search) {
        filter.question = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    return Question.find(filter).skip(offset).limit(limit).sort({ usedAt: -1, createdAt: -1 });
}
