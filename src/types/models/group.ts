import { Types } from "mongoose";
import { ToDTO } from "../common";

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

export interface IGroup {
    _id: Types.ObjectId;
    name: string;
    admin: Types.ObjectId
    members: IGroupMember[];
    features: IGroupFeatures;
    createdAt: Date;
    addPoints(userId: string | Types.ObjectId, points: number): Promise<void>;
}

export type GroupMemberDTO = ToDTO<IGroupMember>;
export type GroupDTO = ToDTO<IGroup>;