import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";
import type { QuestionType } from "@/types/models/question";

export interface IQuestionTemplate {
    _id: Types.ObjectId;
    packId: string;
    category: string;
    questionType: QuestionType;
    question: string;
    options?: unknown[];
    createdAt: Date;
}

export type QuestionTemplateDocument = HydratedDocument<IQuestionTemplate>;

export type QuestionTemplateDTO = ToDTO<IQuestionTemplate>;
