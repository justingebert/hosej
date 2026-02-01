import { Types } from "mongoose";
import { QuestionType } from "@/types/models/question";

export interface IQuestionTemplate {
    _id: Types.ObjectId;
    packId: string;
    category: string;
    questionType: QuestionType;
    question: string;
    options?: any;
    createdAt: Date;
}