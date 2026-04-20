import type { Types } from "mongoose";
import type { ToDTO } from "../common";

export enum QuestionPackStatus {
    Active = "active",
    Deprecated = "deprecated",
    Archived = "archived",
}

export interface IQuestionPack {
    _id: Types.ObjectId;
    packId: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    questionCount: number;
    status: QuestionPackStatus;
    createdAt: Date;
}

export type QuestionPackDTO = ToDTO<IQuestionPack>;
