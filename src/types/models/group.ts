import { Types, Document } from "mongoose";
import { AsJson } from "../common";

export interface IGroupMember {
    user: Types.ObjectId;
    name: string;
    points: number;
    streak: number;
    lastPointDate: Date | null;
    joinedAt: Date;
}

export interface IGroup extends Document {
    _id: Types.ObjectId;
    name: string;
    admin: Types.ObjectId;
    members: IGroupMember[];
    question: boolean;
    questionCount: number;
    lastQuestionDate: Date | null;
    rally: boolean;
    rallyCount: number;
    rallyGapDays: number;
    jukebox: boolean;
    jukeboxFrequency: number; //days not implemented yet
    spotifyConnected: boolean;
    createdAt: Date;
    addPoints(userId: Types.ObjectId | string, points: number): Promise<void>;
}


export type IGroupJson = AsJson<IGroup>;
