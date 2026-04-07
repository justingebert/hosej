import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

export const RallyStatus = {
    Created: "created",
    Scheduled: "scheduled",
    Submission: "submission",
    Voting: "voting",
    Results: "results",
    Completed: "completed",
} as const;

export type RallyStatus = (typeof RallyStatus)[keyof typeof RallyStatus];

export interface IPictureSubmission {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    username: string;
    imageKey: string;
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
    status: RallyStatus;
    submissions: IPictureSubmission[];
    startTime: Date | null;
    submissionEnd: Date | null;
    votingEnd: Date | null;
    resultsEnd: Date | null;
    lengthInDays: number;
    createdBy: Types.ObjectId;
    chat: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export type RallyDocument = HydratedDocument<IRally>;

export type RallyDTO = ToDTO<IRally>;
export type PictureSubmissionDTO = ToDTO<IPictureSubmission>;

/** Submission as returned by GET /submissions (imageKey replaced with signed imageUrl) */
export type PictureSubmissionWithUrlDTO = Omit<PictureSubmissionDTO, "imageKey"> & {
    imageUrl: string;
};
