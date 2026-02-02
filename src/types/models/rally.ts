import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

export interface IPictureSubmission {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    username: string;
    imageUrl: string;
    votes: {
        user: Types.ObjectId;
        time: Date;
    }[];
}

/**
 * Plain data interface for Rally documents.
 * Does NOT include Mongoose methods like save().
 */
export interface IRally {
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

export type RallyDocument = HydratedDocument<IRally>;

export type RallyDTO = ToDTO<IRally>;
export type PictureSubmissionDTO = ToDTO<IPictureSubmission>;

// Backward-compatible aliases (prefer new names above)
/** @deprecated Use RallyDTO instead */
export type IRallyJson = RallyDTO;
/** @deprecated Use PictureSubmissionDTO instead */
export type IPictureSubmissionJson = PictureSubmissionDTO;
