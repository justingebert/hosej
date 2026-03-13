import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";
import type { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";

export interface IQuestionTemplate {
    _id: Types.ObjectId;
    packId: string;
    category: string;
    questionType: QuestionType;
    question: string;
    multiSelect: boolean;
    options?: unknown[];

    pairingKeySource?: PairingKeySource;
    pairingMode?: PairingMode;
    pairingKeys?: string[];
    pairingValues?: string[];

    createdAt: Date;
}

export type QuestionTemplateDocument = HydratedDocument<IQuestionTemplate>;

export type QuestionTemplateDTO = ToDTO<IQuestionTemplate>;
