import dbConnect from "@/db/dbConnect";
import ActivityEvent from "@/db/models/ActivityEvent";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { Types } from "mongoose";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { ActivityFeature } from "@/types/models/activityEvent";
import type { ActivityType, MissedActivitySummary } from "@/types/models/activityEvent";

/** Map ActivityFeature enum to the lastSeenAt sub-field key */
const FEATURE_TO_SEEN_KEY: Record<string, "question" | "rally" | "jukebox"> = {
    [ActivityFeature.Question]: "question",
    [ActivityFeature.Rally]: "rally",
    [ActivityFeature.Jukebox]: "jukebox",
};

/** The features that carry a per-user "seen" watermark. */
const TRACKED_FEATURES = [
    ActivityFeature.Question,
    ActivityFeature.Rally,
    ActivityFeature.Jukebox,
] as const;

/**
 * Record an activity event. Intended to be called fire-and-forget
 * from feature services so it never blocks the main action.
 */
export async function recordActivity(params: {
    groupId: string | Types.ObjectId;
    actorUser?: string | null;
    type: ActivityType;
    feature: ActivityFeature;
    entityId: string;
    meta?: Record<string, unknown>;
}): Promise<void> {
    await dbConnect();
    await ActivityEvent.create({
        groupId: params.groupId,
        actorUser: params.actorUser ?? null,
        type: params.type,
        feature: params.feature,
        entityId: params.entityId,
        meta: params.meta,
    });
}

/**
 * Delete all activity events tied to the given entity ids.
 * Called when a question/rally/jukebox rotates so stale events
 * from the prior cycle don't inflate missed-activity counts.
 */
export async function clearActivityForEntities(
    entityIds: Array<string | Types.ObjectId>
): Promise<void> {
    if (entityIds.length === 0) return;
    await dbConnect();
    await ActivityEvent.deleteMany({ entityId: { $in: entityIds } });
}

/**
 * Get missed activity counts per feature for a user in a group.
 * Each feature is compared against its own lastSeenAt timestamp.
 * Excludes events created by the requesting user.
 */
export async function getMissedActivity(
    groupId: string,
    userId: string
): Promise<MissedActivitySummary> {
    await dbConnect();

    const group = await Group.findById(groupId).orFail();

    const member = group.members.find((m) => m.user.toString() === userId);
    if (!member) throw new NotFoundError("User is not a member of this group");

    const defaultSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastSeenAt = member.lastSeenAt ?? { question: null, rally: null, jukebox: null };

    const summary: MissedActivitySummary = {
        [ActivityFeature.Question]: 0,
        [ActivityFeature.Rally]: 0,
        [ActivityFeature.Jukebox]: 0,
    };

    // Query each feature separately using its own "since" timestamp
    await Promise.all(
        TRACKED_FEATURES.map(async (feature) => {
            const key = FEATURE_TO_SEEN_KEY[feature];
            const since = lastSeenAt[key] ?? defaultSince;

            const count = await ActivityEvent.countDocuments({
                groupId: group._id,
                feature,
                createdAt: { $gt: since },
                actorUser: { $ne: new Types.ObjectId(userId) },
            });

            summary[feature] = count;
        })
    );

    return summary;
}

/**
 * Mark a specific feature as seen for the user in a group.
 * Only updates the timestamp for the given feature.
 */
export async function markFeatureSeen(
    groupId: string,
    userId: string,
    feature: string
): Promise<Date> {
    await dbConnect();

    const key = FEATURE_TO_SEEN_KEY[feature];
    if (!key) throw new ValidationError(`Invalid feature: ${feature}`);

    const now = new Date();
    const result = await Group.findOneAndUpdate(
        { _id: groupId, "members.user": userId },
        { $set: { [`members.$.lastSeenAt.${key}`]: now } },
        { new: true }
    );

    if (!result) throw new NotFoundError("Group or member not found");

    return now;
}

/**
 * For each of the user's groups, count the activity they haven't seen.
 * Returns a map of groupId → count (0 when there is nothing new).
 *
 * The count is the sum of the same per-feature counts getMissedActivity
 * returns, so a group's badge always agrees with the feature badges inside it.
 */
export async function getGroupsWithActivity(userId: string): Promise<Record<string, number>> {
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const groupIds = user.groups.map((g) => new Types.ObjectId(String(g)));
    if (groupIds.length === 0) return {};

    const groups = await Group.find({ _id: { $in: groupIds } }, { members: 1 });

    const result: Record<string, number> = {};
    const userObjectId = new Types.ObjectId(userId);
    const defaultSince = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // One clause per (group, feature) so every feature is compared against its
    // OWN watermark. Collapsing to a single baseline (this previously used the
    // oldest watermark across the three) widens each group's window to its most
    // neglected feature, which re-counts activity the user has already seen —
    // the group badge then lights up while the feature badges inside read zero.
    const clauses: Record<string, unknown>[] = [];

    for (const group of groups) {
        result[group._id.toString()] = 0;

        const member = group.members.find((m) => m.user.equals(userObjectId));
        const lastSeenAt = member?.lastSeenAt ?? { question: null, rally: null, jukebox: null };

        for (const feature of TRACKED_FEATURES) {
            clauses.push({
                groupId: group._id,
                feature,
                createdAt: { $gt: lastSeenAt[FEATURE_TO_SEEN_KEY[feature]] ?? defaultSince },
            });
        }
    }

    if (clauses.length === 0) return result;

    // One aggregation for every group, replacing a countDocuments per group.
    const counts = await ActivityEvent.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { $or: clauses, actorUser: { $ne: userObjectId } } },
        { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ]);

    for (const { _id, count } of counts) {
        result[_id.toString()] = count;
    }

    return result;
}
