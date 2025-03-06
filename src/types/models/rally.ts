import { Types, Document } from "mongoose";

export interface IPictureSubmission {
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