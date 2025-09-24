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

export interface IGroup {
    _id: Types.ObjectId;
    name: string;
    admin: Types.ObjectId
    members: IGroupMember[];
    questionCount: number;
    lastQuestionDate: Date | null;
    rallyCount: number;
    rallyGapDays: number;
    jukebox: boolean;
    createdAt: Date;
    addPoints(userId: string | Types.ObjectId, points: number): Promise<void>;
}

export type GroupMemberDTO = ToDTO<IGroupMember>;
export type GroupDTO = ToDTO<IGroup>;