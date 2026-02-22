import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/Rally";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { isUserAdmin, isUserInGroup, addPointsToMember } from "@/lib/services/group";
import { createChatForEntity } from "@/lib/services/chat";
import { EntityModel } from "@/types/models/chat";
import { sendNotification } from "@/lib/sendNotification";
import {
    CREATED_RALLY_POINTS,
    SUBMITTED_RALLY_POINTS,
    VOTED_RALLY_POINTS,
} from "@/lib/utils/POINT_CONFIG";
import type { RallyDocument } from "@/types/models/rally";

// ─── S3 Client (module-scoped) ──────────────────────────────────────────────

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

// ─── State Machine ──────────────────────────────────────────────────────────

/**
 * Advance rally state machine and send notifications.
 * Mutates rallies in-place and saves to DB.
 *
 * State flow:
 *   created → used (submission period) → votingOpen → resultsShowing → deactivated
 */
async function advanceRallyStates(
    rallies: RallyDocument[],
    groupId: string,
    groupName: string,
    rallyGapDays: number
): Promise<RallyDocument[]> {
    const currentTime = new Date();

    for (const rally of rallies) {
        if (!rally.endTime || !rally.startTime) continue;
        const endTime = new Date(rally.endTime);
        const startTime = new Date(rally.startTime);

        // Start rally: mark as used when its start time arrives
        if (!rally.used && currentTime >= startTime && !rally.votingOpen && !rally.resultsShowing) {
            rally.used = true;
            await rally.save();

            await sendNotification(
                `📷 New ${groupName} Rally Started! 📷`,
                "📷 PARTICIPATE NOW! 📷",
                groupId
            );
            continue;
        }

        if (currentTime < endTime) continue;

        // Submission period ended → open voting for 24h
        if (!rally.votingOpen && !rally.resultsShowing) {
            rally.votingOpen = true;
            rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
            await rally.save();

            await sendNotification(`📷${groupName} Rally Voting! 📷`, "📷 VOTE NOW 📷", groupId);
        }
        // Voting ended → show results for 24h
        else if (rally.votingOpen && !rally.resultsShowing) {
            rally.votingOpen = false;
            rally.resultsShowing = true;
            rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
            await rally.save();

            await sendNotification(`📷 ${groupName} Rally Results! 📷`, "📷 VIEW NOW 📷", groupId);
        }
        // Results ended → deactivate and activate next rally
        else if (rally.resultsShowing && !rally.votingOpen) {
            rally.resultsShowing = false;
            rally.active = false;
            rally.endTime = currentTime;
            await rally.save();

            const gapEndTime = new Date(currentTime.getTime() + rallyGapDays * 24 * 60 * 60 * 1000);

            const newRally = await Rally.findOne({
                groupId: groupId,
                active: false,
                used: false,
            });

            if (newRally) {
                newRally.active = true;
                newRally.startTime = gapEndTime;
                newRally.endTime = new Date(
                    gapEndTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000
                );
                await newRally.save();

                await sendNotification(
                    `📷 ${groupName} Rally finished! 📷`,
                    `📷 Next Rally starting: ${newRally.startTime.toLocaleString()}📷`,
                    groupId
                );
            }
        }
    }

    // Return rallies that are currently running (past their start time)
    return rallies.filter((rally) => rally.startTime && currentTime >= new Date(rally.startTime));
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Get active rallies for a group, advancing the state machine as needed.
 */
export async function getRalliesWithStateTransitions(
    userId: string,
    groupId: string
): Promise<{ rallies: RallyDocument[]; message?: string }> {
    await dbConnect();
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const rallies = await Rally.find({ groupId, active: true });
    if (rallies.length === 0) {
        return { message: "No active rallies", rallies: [] };
    }

    const currentRallies = await advanceRallyStates(
        rallies,
        groupId,
        group.name,
        group.features.rallies.settings.rallyGapDays
    );

    if (currentRallies.length === 0) {
        return { message: "No rallies left", rallies: [] };
    }

    return { rallies: currentRallies };
}

/**
 * Create a new rally for a group.
 */
export async function createRally(
    userId: string,
    groupId: string,
    data: { task: string; lengthInDays: number }
): Promise<void> {
    await dbConnect();
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
        submittedBy: submittingUser._id,
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
    await dbConnect();
    await isUserAdmin(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const activeRallies = await Rally.find({ groupId, active: true });
    if (activeRallies.length >= group.features.rallies.settings.rallyCount) {
        return { message: "rallies already active", rallies: activeRallies };
    }

    const countToActivate = group.features.rallies.settings.rallyCount - activeRallies.length;
    const rallies = await Rally.find({ groupId, active: false, used: false }).limit(
        countToActivate
    );

    const currentTime = new Date();
    for (const rally of rallies) {
        rally.active = true;
        rally.startTime = new Date(currentTime.getTime());
        rally.endTime = new Date(currentTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000);
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
    await dbConnect();
    await isUserInGroup(userId, groupId);

    const rally = await Rally.findById(rallyId);
    if (!rally) throw new NotFoundError("Rally not found");

    const submissions = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rally.submissions.map(async (submission: any) => {
            const urlObject = new URL(submission.imageUrl);
            let s3Key = urlObject.pathname;
            if (s3Key.startsWith("/")) {
                s3Key = s3Key.substring(2);
            }

            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                ResponseCacheControl: "max-age=86400, public",
            });

            let url;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                url = await getSignedUrl(s3 as any, command, { expiresIn: 300 });
            } catch (s3Error: unknown) {
                const message = s3Error instanceof Error ? s3Error.message : "Unknown S3 error";
                console.error(
                    `Failed to generate pre-signed URL for ${submission.imageUrl}`,
                    s3Error
                );
                throw new Error(`Failed to generate pre-signed URL: ${message}`);
            }

            return {
                ...submission.toObject(),
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
 */
export async function addSubmission(
    userId: string,
    groupId: string,
    rallyId: string,
    imageUrl: string
): Promise<RallyDocument> {
    await dbConnect();
    await isUserInGroup(userId, groupId);

    if (!imageUrl) {
        throw new ValidationError("imageUrl is required");
    }

    const group = await Group.findById(groupId);
    const sendUser = await User.findById(userId);
    if (!group || !sendUser) throw new NotFoundError("Group or user not found");

    const rally = await Rally.findById(rallyId);
    if (!rally) throw new NotFoundError("Rally not found");

    // Prevent duplicate submissions
    const existingSubmission = rally.submissions.find((s) => s.userId.toString() === userId);
    if (existingSubmission) {
        throw new ConflictError("You have already submitted to this rally");
    }

    const newSubmission = {
        userId: sendUser._id,
        username: sendUser.username,
        imageUrl,
        time: Date.now(),
    };

    const updatedRally = await Rally.findByIdAndUpdate(
        rallyId,
        { $push: { submissions: newSubmission } },
        { new: true, runValidators: true }
    );

    if (!updatedRally) throw new NotFoundError("Rally not found");

    await addPointsToMember(group, userId, SUBMITTED_RALLY_POINTS);

    return updatedRally;
}

/**
 * Vote on a rally submission.
 * Prevents: self-voting, duplicate votes, voting when voting is not open.
 */
export async function voteOnSubmission(
    userId: string,
    groupId: string,
    rallyId: string,
    submissionId: string
): Promise<void> {
    await dbConnect();
    await isUserInGroup(userId, groupId);

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const rally = await Rally.findOne({ groupId, _id: rallyId });
    if (!rally) throw new NotFoundError("Rally not found");

    // Guard: voting must be open
    if (!rally.votingOpen) {
        throw new ValidationError("Voting is not open for this rally");
    }

    const submission = rally.submissions.find((s) => s._id.toString() === submissionId);
    if (!submission) throw new NotFoundError("Submission not found");

    // Prevent self-voting
    if (submission.userId.toString() === userId) {
        throw new ConflictError("You cannot vote on your own submission");
    }

    // Prevent duplicate votes (fixed: use .toString() for ObjectId comparison)
    const userVoted = submission.votes.find((vote) => vote.user.toString() === userId);
    if (userVoted) {
        throw new ConflictError("User already voted");
    }

    submission.votes.push({
        user: userId as unknown as import("mongoose").Types.ObjectId,
        time: new Date(),
    });
    await rally.save();

    await addPointsToMember(group, userId, VOTED_RALLY_POINTS);
}
