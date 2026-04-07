import Rally from "@/db/models/Rally";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { generateSignedUrl } from "@/lib/s3";
import { isUserAdmin, isUserInGroup, addPointsToMember } from "@/lib/services/group";
import { createChatForEntity } from "@/lib/services/chat";
import { EntityModel } from "@/types/models/chat";
import { sendNotification } from "@/lib/sendNotification";
import {
    CREATED_RALLY_POINTS,
    SUBMITTED_RALLY_POINTS,
    VOTED_RALLY_POINTS,
} from "@/lib/utils/POINT_CONFIG";
import { RallyStatus } from "@/types/models/rally";
import type { RallyDocument } from "@/types/models/rally";
import { recordActivity } from "@/lib/services/activity";
import { ActivityFeature, ActivityType } from "@/types/models/activityEvent";

const VOTING_DURATION_MS = 24 * 60 * 60 * 1000;
const RESULTS_DURATION_MS = 24 * 60 * 60 * 1000;

// ─── State Machine ──────────────────────────────────────────────────────────

/**
 * Advance rally state machine and send notifications.
 * Mutates rallies in-place and saves to DB.
 *
 * Status flow:
 *   created → scheduled → submission → voting → results → completed
 */
async function advanceRallyStates(
    rallies: RallyDocument[],
    groupId: string,
    groupName: string,
    rallyGapDays: number
): Promise<void> {
    const now = new Date();

    for (const rally of rallies) {
        switch (rally.status) {
            case RallyStatus.Scheduled: {
                if (!rally.startTime || now < rally.startTime) break;

                rally.status = RallyStatus.Submission;
                await rally.save();

                recordActivity({
                    groupId,
                    type: ActivityType.RallyActivated,
                    feature: ActivityFeature.Rally,
                    entityId: rally._id.toString(),
                    meta: { task: rally.task },
                }).catch((err) => console.error("Activity log failed", err));

                await sendNotification(
                    `📷 New ${groupName} Rally Started! 📷`,
                    "📷 PARTICIPATE NOW! 📷",
                    groupId
                );
                break;
            }

            case RallyStatus.Submission: {
                if (!rally.submissionEnd || now < rally.submissionEnd) break;

                rally.status = RallyStatus.Voting;
                rally.votingEnd = new Date(now.getTime() + VOTING_DURATION_MS);
                await rally.save();

                await sendNotification(
                    `📷${groupName} Rally Voting! 📷`,
                    "📷 VOTE NOW 📷",
                    groupId
                );
                break;
            }

            case RallyStatus.Voting: {
                if (!rally.votingEnd || now < rally.votingEnd) break;

                rally.status = RallyStatus.Results;
                rally.resultsEnd = new Date(now.getTime() + RESULTS_DURATION_MS);
                await rally.save();

                await sendNotification(
                    `📷 ${groupName} Rally Results! 📷`,
                    "📷 VIEW NOW 📷",
                    groupId
                );
                break;
            }

            case RallyStatus.Results: {
                if (!rally.resultsEnd || now < rally.resultsEnd) break;

                rally.status = RallyStatus.Completed;
                await rally.save();

                // Activate next rally from the pool
                const gapEnd = new Date(now.getTime() + rallyGapDays * 24 * 60 * 60 * 1000);

                const nextRally = await Rally.findOne({
                    groupId,
                    status: RallyStatus.Created,
                });

                if (nextRally) {
                    nextRally.status = RallyStatus.Scheduled;
                    nextRally.startTime = gapEnd;
                    nextRally.submissionEnd = new Date(
                        gapEnd.getTime() + nextRally.lengthInDays * 24 * 60 * 60 * 1000
                    );
                    await nextRally.save();

                    await sendNotification(
                        `📷 ${groupName} Rally finished! 📷`,
                        `📷 Next Rally starting: ${nextRally.startTime.toLocaleString()}📷`,
                        groupId
                    );
                }
                break;
            }
        }
    }
}

// ─── Queryable status sets ──────────────────────────────────────────────────

/** Statuses where a rally is "in progress" (visible to users on the rally page) */
const ACTIVE_STATUSES = [RallyStatus.Submission, RallyStatus.Voting, RallyStatus.Results] as const;

/** Statuses that the cron job needs to process for state transitions */
const PROCESSABLE_STATUSES = [
    RallyStatus.Scheduled,
    RallyStatus.Submission,
    RallyStatus.Voting,
    RallyStatus.Results,
] as const;

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Get active rallies for a group (pure read — no state mutation).
 * Returns rallies in submission, voting, or results phase.
 */
export async function getActiveRallies(
    userId: string,
    groupId: string
): Promise<{ rallies: RallyDocument[]; message?: string }> {
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const rallies = await Rally.find({
        groupId,
        status: { $in: ACTIVE_STATUSES },
    });

    if (rallies.length === 0) {
        return { message: "No active rallies", rallies: [] };
    }

    return { rallies };
}

/**
 * Cron entry point: advance rally state machine for a group.
 * Loads group + processable rallies, runs state transitions, sends notifications.
 */
export async function processRallyStateTransitions(groupId: string): Promise<void> {
    const group = await Group.findById(groupId);
    if (!group) return;

    const rallies = await Rally.find({
        groupId,
        status: { $in: PROCESSABLE_STATUSES },
    });
    if (rallies.length === 0) return;

    await advanceRallyStates(
        rallies,
        groupId,
        group.name,
        group.features.rallies.settings.rallyGapDays
    );
}

/**
 * Create a new rally for a group.
 */
export async function createRally(
    userId: string,
    groupId: string,
    data: { task: string; lengthInDays: number }
): Promise<void> {
    await isUserInGroup(userId, groupId);

    const { task, lengthInDays } = data;
    if (!task || !lengthInDays) {
        throw new ValidationError("task and lengthInDays are required");
    }

    const group = await Group.findById(groupId);
    const submittingUser = await User.findById(userId);
    if (!group || !submittingUser) throw new NotFoundError("Group or user not found");

    const newRally = new Rally({
        groupId,
        task,
        lengthInDays,
        createdBy: submittingUser._id,
    });
    await newRally.save();

    const chat = await createChatForEntity(groupId, newRally._id, EntityModel.Rally);
    newRally.chat = chat._id;
    await newRally.save();

    await addPointsToMember(group, userId, CREATED_RALLY_POINTS);
}

/**
 * Activate pending rallies up to the group's configured rally count.
 * Admin-only operation.
 */
export async function activateRallies(
    userId: string,
    groupId: string
): Promise<{ message: string; rallies: RallyDocument[] }> {
    await isUserAdmin(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const activeRallies = await Rally.find({
        groupId,
        status: { $in: ACTIVE_STATUSES },
    });
    if (activeRallies.length >= group.features.rallies.settings.rallyCount) {
        return { message: "rallies already active", rallies: activeRallies };
    }

    const countToActivate = group.features.rallies.settings.rallyCount - activeRallies.length;
    const rallies = await Rally.find({
        groupId,
        status: RallyStatus.Created,
    }).limit(countToActivate);

    const now = new Date();
    for (const rally of rallies) {
        rally.status = RallyStatus.Submission;
        rally.startTime = now;
        rally.submissionEnd = new Date(now.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000);
        await rally.save();
    }

    return { message: "Activated rallies", rallies };
}

/**
 * Get submissions for a rally with presigned S3 URLs, sorted by vote count.
 */
export async function getSubmissions(
    userId: string,
    groupId: string,
    rallyId: string
): Promise<Record<string, unknown>[]> {
    await isUserInGroup(userId, groupId);

    const rally = await Rally.findById(rallyId);
    if (!rally) throw new NotFoundError("Rally not found");

    const submissions = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rally.submissions.map(async (submission: any) => {
            const { url } = await generateSignedUrl(submission.imageKey, 300);

            return {
                ...(submission.toObject ? submission.toObject() : submission),
                imageUrl: url,
            };
        })
    );

    submissions.sort((a, b) => b.votes.length - a.votes.length);

    return submissions;
}

/**
 * Add a submission to a rally.
 * Prevents duplicate submissions from the same user.
 * Only allowed during the submission phase.
 */
export async function addSubmission(
    userId: string,
    groupId: string,
    rallyId: string,
    imageKey: string
): Promise<RallyDocument> {
    await isUserInGroup(userId, groupId);

    if (!imageKey) {
        throw new ValidationError("imageKey is required");
    }

    const group = await Group.findById(groupId);
    const sendUser = await User.findById(userId);
    if (!group || !sendUser) throw new NotFoundError("Group or user not found");

    const rally = await Rally.findById(rallyId);
    if (!rally) throw new NotFoundError("Rally not found");

    if (rally.status !== RallyStatus.Submission) {
        throw new ValidationError("Submissions are not accepted in this phase");
    }

    const existingSubmission = rally.submissions.find((s) => s.userId.toString() === userId);
    if (existingSubmission) {
        throw new ConflictError("You have already submitted to this rally");
    }

    const newSubmission = {
        userId: sendUser._id,
        username: sendUser.username,
        imageKey,
        time: Date.now(),
    };

    const updatedRally = await Rally.findByIdAndUpdate(
        rallyId,
        { $push: { submissions: newSubmission } },
        { new: true, runValidators: true }
    );

    if (!updatedRally) throw new NotFoundError("Rally not found");

    await addPointsToMember(group, userId, SUBMITTED_RALLY_POINTS);

    recordActivity({
        groupId,
        actorUser: userId,
        type: ActivityType.RallySubmission,
        feature: ActivityFeature.Rally,
        entityId: rallyId,
    }).catch((err) => console.error("Activity log failed", err));

    return updatedRally;
}

/**
 * Vote on a rally submission.
 * Prevents: self-voting, duplicate votes, voting when not in voting phase.
 * Uses atomic $push to prevent race conditions on duplicate votes.
 */
export async function voteOnSubmission(
    userId: string,
    groupId: string,
    rallyId: string,
    submissionId: string
): Promise<void> {
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const rally = await Rally.findOne({ groupId, _id: rallyId });
    if (!rally) throw new NotFoundError("Rally not found");

    if (rally.status !== RallyStatus.Voting) {
        throw new ValidationError("Voting is not open for this rally");
    }

    const submission = rally.submissions.find((s) => s._id.toString() === submissionId);
    if (!submission) throw new NotFoundError("Submission not found");

    if (submission.userId.toString() === userId) {
        throw new ConflictError("You cannot vote on your own submission");
    }

    // Atomic $push with duplicate guard — prevents race conditions
    const result = await Rally.updateOne(
        {
            _id: rallyId,
            submissions: {
                $elemMatch: {
                    _id: new Types.ObjectId(submissionId),
                    "votes.user": { $ne: new Types.ObjectId(userId) },
                },
            },
        },
        {
            $push: {
                "submissions.$.votes": {
                    user: new Types.ObjectId(userId),
                    time: new Date(),
                },
            },
        }
    );

    if (result.modifiedCount === 0) {
        throw new ConflictError("User already voted");
    }

    await addPointsToMember(group, userId, VOTED_RALLY_POINTS);

    recordActivity({
        groupId,
        actorUser: userId,
        type: ActivityType.RallyVote,
        feature: ActivityFeature.Rally,
        entityId: rallyId,
    }).catch((err) => console.error("Activity log failed", err));
}
