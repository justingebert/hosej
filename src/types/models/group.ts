import { Types } from "mongoose";

export interface IGroupMember extends Document {
    user: Types.ObjectId;
    name: string;
    points: number;
    streak: number;
    lastPointDate: Date | null;
    joinedAt: Date;
}

export interface IGroup extends Document {
    name: string;
    admin: Types.ObjectId
    members: IGroupMember[];
    questionCount: number;
    lastQuestionDate: Date | null;
    rallyCount: number;
    rallyGapDays: number;
    jukebox: boolean;
    jukeboxFrequency: number; //days not implemented yet
    spotifyConnected: boolean;
    createdAt: Date;
    addPoints(userId: Types.ObjectId, points: number): Promise<void>;
}
