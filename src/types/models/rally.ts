import { Types, Document, Schema } from "mongoose";
import { AsJson } from "../common";

export interface IPictureSubmission{
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    username: string;
    imageUrl: string;
    votes: [
        {
            user: Types.ObjectId;
            time: Date;
        }
    ];
}

export interface IRally extends Document {
    _id: Types.ObjectId;
    groupId: Types.ObjectId;
    task: string;
    submissions: IPictureSubmission[];
    startTime: Date | null;
    endTime: Date | null;
    votingOpen: boolean;
    resultsShowing: boolean;
    used: boolean;
    active: boolean;
    lengthInDays: number;
    submittedBy: Types.ObjectId;
    chat: Types.ObjectId;
    createdAt: Date;
}

export type IRallyJson = AsJson<IRally>;
export type IPictureSubmissionJson = AsJson<IPictureSubmission>;