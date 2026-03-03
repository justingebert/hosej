import type { Types } from "mongoose";
import type { ToDTO } from "../common";

export interface IQuestionPack {
    _id: Types.ObjectId;
    packId: string;
    name: string;
    description: string;
    category: string;
    questionCount: number;
    createdAt: Date;
}

export type QuestionPackDTO = ToDTO<IQuestionPack>;
