import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";
import type { IPairingConfig, QuestionType } from "@/types/models/question";

export interface IQuestionTemplate {
    _id: Types.ObjectId;
    packId: string;
    category: string;
    questionType: QuestionType;
    question: string;
    multiSelect: boolean;
    options?: unknown[];

    pairing?: IPairingConfig;

    createdAt: Date;
}

export type QuestionTemplateDocument = HydratedDocument<IQuestionTemplate>;

export type QuestionTemplateDTO = ToDTO<IQuestionTemplate>;
