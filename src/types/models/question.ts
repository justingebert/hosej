import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "@/types/common";

export interface IQuestion {
    _id: Types.ObjectId;
    groupId: Types.ObjectId;
    category: string;
    questionType: QuestionType;
    question: string;
    image?: string;

    options?: unknown[];
    answers: IAnswer[];
    rating: {
        good: Types.ObjectId[];
        ok: Types.ObjectId[];
        bad: Types.ObjectId[];
    };

    used: boolean;
    active: boolean;
    usedAt?: Date;
    submittedBy?: Types.ObjectId | null;
    templateId?: Types.ObjectId;

    chat?: Types.ObjectId;
    createdAt: Date;

    imageUrl?: string;
}

export enum QuestionType {
    UsersSelectOne = "users-select-one",
    UsersSelectMultiple = "users-select-multiple",
    CustomSelectOne = "custom-select-one",
    CustomSelectMultiple = "custom-select-multiple",
    Text = "text",
    Rating = "rating",
    ImageSelectOne = "image-select-one",
    ImageSelectMultiple = "image-select-multiple",
}

export interface IAnswer {
    user: Types.ObjectId;
    response: string | string[] | Record<string, unknown>;
    time: Date;
}

export interface IResult {
    option: string;
    count: number;
    percentage: number;
    users: string[];
}

export type QuestionDTO = ToDTO<IQuestion>;

export type QuestionDocument = HydratedDocument<IQuestion>;

export type UserRating = "good" | "ok" | "bad" | null;

export type SignedUrlDTO = { key: string; url: string };

export type QuestionOptionDTO = string | SignedUrlDTO;

export type QuestionWithUserStateDTO = Omit<QuestionDTO, "options"> & {
    options?: QuestionOptionDTO[];
    userHasVoted: boolean;
    userRating: UserRating;
};

export type QuestionResultsDTO = {
    results: IResult[];
    totalVotes: number;
    totalUsers: number;
    questionType: QuestionType;
};
