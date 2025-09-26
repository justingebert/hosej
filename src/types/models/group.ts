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

interface IGroupJukeboxSettings {
    enabled: boolean;
    concurrent: string[]; // array of names of jukebox, length is concurrent count
    maxConcurrentCount: number;
    activationDays: number[]
}

export interface IGroup {
    _id: Types.ObjectId;
    name: string;
    admin: Types.ObjectId
    members: IGroupMember[];
    questionCount: number;
    lastQuestionDate: Date | null;
    rallyCount: number;
    rallyGapDays: number;
    jukeboxSettings: IGroupJukeboxSettings;
    createdAt: Date;
    addPoints(userId: string | Types.ObjectId, points: number): Promise<void>;
}

export type GroupMemberDTO = ToDTO<IGroupMember>;
export type GroupDTO = ToDTO<IGroup>;