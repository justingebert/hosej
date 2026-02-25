import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

export interface IGroupMember {
    user: Types.ObjectId;
    name: string;
    points: number;
    streak: number;
    lastPointDate: Date | null;
    joinedAt: Date;
}

export interface IGroupJukeboxSettings {
    concurrent: string[]; // array of names of jukebox, length is concurrent count
    activationDays: number[];
}

export interface IGroupFeatures {
    questions: {
        enabled: boolean;
        settings: {
            questionCount: number;
            lastQuestionDate: Date | null;
        };
    };
    rallies: {
        enabled: boolean;
        settings: {
            rallyCount: number;
            rallyGapDays: number;
        };
    };
    jukebox: {
        enabled: boolean;
        settings: IGroupJukeboxSettings;
    };
}

/**
 * Plain data interface for Group documents.
 * Does NOT include Mongoose methods like save().
 */
export interface IGroup {
    _id: Types.ObjectId;
    name: string;
    admin: Types.ObjectId;
    members: IGroupMember[];
    features: IGroupFeatures;
    createdAt: Date;
}

/**
 * Instance methods defined on Group documents.
 */
export interface IGroupMethods {
    addPoints(userId: string, points: number): Promise<void>;
}

export type GroupDocument = HydratedDocument<IGroup, IGroupMethods>;

export interface UpdateGroupFeatures {
    questions?: {
        enabled: boolean;
        settings?: Partial<IGroupFeatures["questions"]["settings"]>;
    };
    rallies?: {
        enabled: boolean;
        settings?: Partial<IGroupFeatures["rallies"]["settings"]>;
    };
    jukebox?: {
        enabled: boolean;
        settings?: Partial<IGroupJukeboxSettings>;
    };
}

export interface UpdateGroupData {
    name?: string;
    features?: UpdateGroupFeatures;
}

export type GroupMemberDTO = ToDTO<IGroupMember>;
export type GroupDTO = ToDTO<IGroup>;

/** API response type for GET /groups/[groupId] — includes computed field */
export type GroupWithAdminDTO = GroupDTO & { userIsAdmin: boolean };

export interface GroupStatsDTO {
    group: IGroup;
    questionsUsedCount: number;
    questionsLeftCount: number;
    questionsByType: { _id: string; count: number }[];
    questionsByUser: { username: string; count: number }[];
    RalliesUsedCount: number;
    RalliesLeftCount: number;
    messagesCount: number;
}
