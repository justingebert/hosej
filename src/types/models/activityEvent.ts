import type { Types } from "mongoose";
import type { ToDTO } from "@/types/common";

export enum ActivityFeature {
    Question = "question",
    Rally = "rally",
    Jukebox = "jukebox",
    System = "system",
}

export enum ActivityType {
    QuestionVoted = "question:voted",
    QuestionActivated = "question:activated",
    RallySubmission = "rally:submission",
    RallyVote = "rally:vote",
    RallyActivated = "rally:activated",
    JukeboxSongAdded = "jukebox:song_added",
    JukeboxRated = "jukebox:rated",
    JukeboxActivated = "jukebox:activated",
    ChatMessage = "chat:message",
}

export interface IActivityEvent {
    _id: Types.ObjectId;
    groupId: Types.ObjectId;
    actorUser: Types.ObjectId | null;
    type: ActivityType;
    feature: ActivityFeature;
    entityId: Types.ObjectId;
    meta?: Record<string, unknown>;
    createdAt: Date;
}

export type ActivityEventDTO = ToDTO<IActivityEvent>;

export type MissedActivitySummary = Record<
    ActivityFeature.Question | ActivityFeature.Rally | ActivityFeature.Jukebox,
    number
>;
