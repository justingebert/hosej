import type { HydratedDocument, Types } from "mongoose";

export enum ReminderCategory {
    QuestionUnanswered = "question_unanswered",
    RallySubmitDeadline = "rally_submit_deadline",
    RallyVoteDeadline = "rally_vote_deadline",
    RallyFirstSubmission = "rally_first_submission",
    JukeboxSubmit = "jukebox_submit",
    JukeboxRate = "jukebox_rate",
}

export enum ReminderEntityType {
    Question = "question",
    Rally = "rally",
    Jukebox = "jukebox",
}

export interface INotificationLog {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    groupId: Types.ObjectId;
    category: ReminderCategory;
    entityType: ReminderEntityType;
    entityId: Types.ObjectId;
    sentAt: Date;
}

export type NotificationLogDocument = HydratedDocument<INotificationLog>;
