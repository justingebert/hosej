import type { Types } from "mongoose";
import User from "@/db/models/User";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import Jukebox from "@/db/models/Jukebox";
import Group from "@/db/models/Group";
import NotificationLog from "@/db/models/NotificationLog";
import { sendNotification } from "@/lib/integrations/push";
import { NotificationEvent, type NotificationContext } from "@/lib/notifications/templates";
import { ReminderCategory, ReminderEntityType } from "@/types/models/notificationLog";
import {
    DEFAULT_NOTIFICATION_PREFS,
    type NotificationPrefKey,
    type UserDocument,
} from "@/types/models/user";
import type { GroupDocument } from "@/types/models/group";
import type { RallyDocument } from "@/types/models/rally";
import { RallyStatus } from "@/types/models/rally";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DAILY_CAP = 2;
const JUKEBOX_SUBMIT_THRESHOLD_MS = 3 * DAY_MS;
const JUKEBOX_RATE_THRESHOLD_MS = 7 * DAY_MS;

type TrySendArgs = {
    user: UserDocument;
    groupId: Types.ObjectId;
    category: ReminderCategory;
    entityType: ReminderEntityType;
    entityId: Types.ObjectId;
    event: NotificationEvent;
    prefKey: NotificationPrefKey;
    context: NotificationContext;
    verify?: () => Promise<boolean>;
};

function startOfUtcDay(now: Date): Date {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

async function trySendReminder(args: TrySendArgs): Promise<boolean> {
    const { user, category, entityId, prefKey } = args;

    if (!user.fcmToken) return false;

    const prefValue = user.notificationPrefs?.[prefKey] ?? DEFAULT_NOTIFICATION_PREFS[prefKey];
    if (!prefValue) return false;

    const existing = await NotificationLog.findOne({
        userId: user._id,
        category,
        entityId,
    })
        .select({ _id: 1 })
        .lean();
    if (existing) return false;

    const dayStart = startOfUtcDay(new Date());
    const sentToday = await NotificationLog.countDocuments({
        userId: user._id,
        sentAt: { $gte: dayStart },
    });
    if (sentToday >= DAILY_CAP) return false;

    if (args.verify && !(await args.verify())) return false;

    try {
        await NotificationLog.create({
            userId: user._id,
            groupId: args.groupId,
            category,
            entityType: args.entityType,
            entityId,
            sentAt: new Date(),
        });
    } catch (err) {
        // Duplicate key = another worker already claimed this send. Swallow.
        if ((err as { code?: number })?.code === 11000) return false;
        throw err;
    }

    await sendNotification({
        event: args.event,
        context: args.context,
        groupId: args.groupId,
        userIds: [user._id],
    });

    return true;
}

function hoursUntil(target: Date, now: Date): number {
    return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / HOUR_MS));
}

async function loadGroupMemberUsers(group: GroupDocument): Promise<UserDocument[]> {
    const memberIds = group.members.map((m) => m.user);
    if (memberIds.length === 0) return [];
    return User.find({ _id: { $in: memberIds } });
}

async function runQuestionUnanswered(group: GroupDocument, users: UserDocument[]): Promise<void> {
    const questions = await Question.find({ groupId: group._id, active: true });
    for (const question of questions) {
        const answered = new Set(question.answers.map((a) => a.user.toString()));
        for (const user of users) {
            if (answered.has(user._id.toString())) continue;
            await trySendReminder({
                user,
                groupId: group._id,
                category: ReminderCategory.QuestionUnanswered,
                entityType: ReminderEntityType.Question,
                entityId: question._id,
                event: NotificationEvent.QuestionUnanswered,
                prefKey: "questionUnanswered",
                context: { groupName: group.name },
                verify: async () => {
                    const fresh = await Question.findById(question._id)
                        .select({ answers: 1, active: 1 })
                        .lean();
                    if (!fresh || !fresh.active) return false;
                    return !fresh.answers.some((a) => a.user.toString() === user._id.toString());
                },
            }).catch((err) =>
                console.error(`question-unanswered reminder failed for user ${user._id}`, err)
            );
        }
    }
}

async function runRallySubmitDeadline(
    group: GroupDocument,
    users: UserDocument[],
    now: Date
): Promise<void> {
    const rallies = await Rally.find({
        groupId: group._id,
        status: RallyStatus.Submission,
        submissionEnd: { $gt: now, $lte: new Date(now.getTime() + DAY_MS) },
    });
    for (const rally of rallies) {
        if (!rally.submissionEnd) continue;
        const submitted = new Set(rally.submissions.map((s) => s.userId.toString()));
        const hoursLeft = hoursUntil(rally.submissionEnd, now);
        for (const user of users) {
            if (submitted.has(user._id.toString())) continue;
            await trySendReminder({
                user,
                groupId: group._id,
                category: ReminderCategory.RallySubmitDeadline,
                entityType: ReminderEntityType.Rally,
                entityId: rally._id,
                event: NotificationEvent.RallySubmitDeadline,
                prefKey: "rallySubmitDeadline",
                context: {
                    groupName: group.name,
                    rallyTask: rally.task,
                    hoursLeft,
                },
                verify: async () => {
                    const fresh = await Rally.findById(rally._id)
                        .select({ submissions: 1, status: 1 })
                        .lean();
                    if (!fresh || fresh.status !== RallyStatus.Submission) return false;
                    return !fresh.submissions.some(
                        (s) => s.userId.toString() === user._id.toString()
                    );
                },
            }).catch((err) =>
                console.error(`rally-submit reminder failed for user ${user._id}`, err)
            );
        }
    }
}

async function runRallyVoteDeadline(
    group: GroupDocument,
    users: UserDocument[],
    now: Date
): Promise<void> {
    const rallies = await Rally.find({
        groupId: group._id,
        status: RallyStatus.Voting,
        votingEnd: { $gt: now, $lte: new Date(now.getTime() + DAY_MS) },
    });
    for (const rally of rallies) {
        if (!rally.votingEnd) continue;
        const hasVoted = (userId: string) =>
            rally.submissions.some((s) => s.votes.some((v) => v.user.toString() === userId));
        const hoursLeft = hoursUntil(rally.votingEnd, now);
        for (const user of users) {
            if (hasVoted(user._id.toString())) continue;
            await trySendReminder({
                user,
                groupId: group._id,
                category: ReminderCategory.RallyVoteDeadline,
                entityType: ReminderEntityType.Rally,
                entityId: rally._id,
                event: NotificationEvent.RallyVoteDeadline,
                prefKey: "rallyVoteDeadline",
                context: {
                    groupName: group.name,
                    rallyTask: rally.task,
                    hoursLeft,
                },
                verify: async () => {
                    const fresh = await Rally.findById(rally._id)
                        .select({ submissions: 1, status: 1 })
                        .lean();
                    if (!fresh || fresh.status !== RallyStatus.Voting) return false;
                    return !fresh.submissions.some((s) =>
                        s.votes.some((v) => v.user.toString() === user._id.toString())
                    );
                },
            }).catch((err) =>
                console.error(`rally-vote reminder failed for user ${user._id}`, err)
            );
        }
    }
}

async function runJukeboxReminders(
    group: GroupDocument,
    users: UserDocument[],
    now: Date
): Promise<void> {
    const jukeboxes = await Jukebox.find({ groupId: group._id, active: true });
    for (const jb of jukeboxes) {
        const ageMs = now.getTime() - jb.createdAt.getTime();
        const jukeboxTitle = jb.title ?? "Jukebox";

        if (ageMs >= JUKEBOX_SUBMIT_THRESHOLD_MS) {
            const submitters = new Set(jb.songs.map((s) => s.submittedBy.toString()));
            for (const user of users) {
                if (submitters.has(user._id.toString())) continue;
                await trySendReminder({
                    user,
                    groupId: group._id,
                    category: ReminderCategory.JukeboxSubmit,
                    entityType: ReminderEntityType.Jukebox,
                    entityId: jb._id,
                    event: NotificationEvent.JukeboxSubmit,
                    prefKey: "jukeboxSubmit",
                    context: { groupName: group.name, jukeboxTitle },
                    verify: async () => {
                        const fresh = await Jukebox.findById(jb._id)
                            .select({ songs: 1, active: 1 })
                            .lean();
                        if (!fresh || !fresh.active) return false;
                        return !fresh.songs.some(
                            (s) => s.submittedBy.toString() === user._id.toString()
                        );
                    },
                }).catch((err) =>
                    console.error(`jukebox-submit reminder failed for user ${user._id}`, err)
                );
            }
        }

        if (ageMs >= JUKEBOX_RATE_THRESHOLD_MS) {
            for (const user of users) {
                const hasRated = jb.songs.some((s) =>
                    s.ratings.some((r) => r.userId.toString() === user._id.toString())
                );
                if (hasRated) continue;
                await trySendReminder({
                    user,
                    groupId: group._id,
                    category: ReminderCategory.JukeboxRate,
                    entityType: ReminderEntityType.Jukebox,
                    entityId: jb._id,
                    event: NotificationEvent.JukeboxRate,
                    prefKey: "jukeboxRate",
                    context: { groupName: group.name, jukeboxTitle },
                    verify: async () => {
                        const fresh = await Jukebox.findById(jb._id)
                            .select({ songs: 1, active: 1 })
                            .lean();
                        if (!fresh || !fresh.active) return false;
                        return !fresh.songs.some((s) =>
                            s.ratings.some((r) => r.userId.toString() === user._id.toString())
                        );
                    },
                }).catch((err) =>
                    console.error(`jukebox-rate reminder failed for user ${user._id}`, err)
                );
            }
        }
    }
}

/**
 * Orchestrator called per-group from the reminders cron.
 */
export async function runRemindersForGroup(group: GroupDocument): Promise<void> {
    const now = new Date();
    const users = await loadGroupMemberUsers(group);
    if (users.length === 0) return;

    await runQuestionUnanswered(group, users);
    await runRallySubmitDeadline(group, users, now);
    await runRallyVoteDeadline(group, users, now);
    await runJukeboxReminders(group, users, now);
}

/**
 * Fired from rally.addSubmission when a rally transitions 0 → 1 submissions.
 * Notifies every group member except the submitter (who just submitted).
 */
export async function runFirstSubmissionReminder(
    rally: RallyDocument,
    groupId: string | Types.ObjectId,
    submittingUserId: string | Types.ObjectId
): Promise<void> {
    const group = await Group.findById(groupId);
    if (!group) return;

    const submitterStr = submittingUserId.toString();
    const otherMemberIds = group.members
        .map((m) => m.user)
        .filter((u) => u.toString() !== submitterStr);
    if (otherMemberIds.length === 0) return;

    const users = await User.find({ _id: { $in: otherMemberIds } });

    for (const user of users) {
        await trySendReminder({
            user,
            groupId: group._id,
            category: ReminderCategory.RallyFirstSubmission,
            entityType: ReminderEntityType.Rally,
            entityId: rally._id,
            event: NotificationEvent.RallyFirstSubmission,
            prefKey: "rallyFirstSubmission",
            context: { groupName: group.name, rallyTask: rally.task },
            verify: async () => {
                const fresh = await Rally.findById(rally._id).select({ submissions: 1 }).lean();
                if (!fresh) return false;
                return !fresh.submissions.some((s) => s.userId.toString() === user._id.toString());
            },
        }).catch((err) =>
            console.error(`rally-first-submission reminder failed for user ${user._id}`, err)
        );
    }
}
