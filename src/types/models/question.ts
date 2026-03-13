import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "@/types/common";

export enum QuestionType {
    Users = "users",
    Custom = "custom",
    Image = "image",
    Text = "text",
    Rating = "rating",
    Pairing = "pairing",
}

export enum PairingKeySource {
    Members = "members",
    Custom = "custom",
}

export enum PairingMode {
    Exclusive = "exclusive", // 1:1 — each value used at most once
    Open = "open", // many:1 — values can repeat
}

export interface IQuestion {
    _id: Types.ObjectId;
    groupId: Types.ObjectId;
    category: string;
    questionType: QuestionType;
    question: string;
    image?: string;
    multiSelect: boolean;

    options?: unknown[];
    answers: IAnswer[];
    rating: {
        good: Types.ObjectId[];
        ok: Types.ObjectId[];
        bad: Types.ObjectId[];
    };

    pairingKeySource?: PairingKeySource;
    pairingMode?: PairingMode;
    pairingKeys?: string[];
    pairingValues?: string[];

    used: boolean;
    active: boolean;
    usedAt?: Date;
    submittedBy?: Types.ObjectId | null;
    templateId?: Types.ObjectId;

    chat?: Types.ObjectId;
    createdAt: Date;

    imageUrl?: string;
}

export interface IAnswer {
    user: Types.ObjectId;
    response: string | string[] | Record<string, string>;
    time: Date;
}

export interface IResult {
    option: string;
    count: number;
    percentage: number;
    users: string[];
}

export interface IPairingResult {
    key: string;
    valueCounts: { value: string; count: number; percentage: number; users: string[] }[];
    topValue: string;
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
    pairingResults?: IPairingResult[];
    totalVotes: number;
    totalUsers: number;
    questionType: QuestionType;
    multiSelect: boolean;
};
