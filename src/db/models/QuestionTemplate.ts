import mongoose from "mongoose";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";
import type { IQuestionTemplate } from "@/types/models/questionTemplate";

const questionTemplateSchema = new mongoose.Schema<IQuestionTemplate>({
    packId: { type: String, required: true },
    category: { type: String },
    questionType: {
        type: String,
        enum: Object.values(QuestionType),
        required: true,
    },
    question: { type: String, required: true },
    multiSelect: { type: Boolean, default: false },
    options: { type: mongoose.Schema.Types.Mixed, required: false },
    pairingKeySource: {
        type: String,
        enum: Object.values(PairingKeySource),
        required: false,
    },
    pairingMode: {
        type: String,
        enum: Object.values(PairingMode),
        required: false,
    },
    pairingKeys: { type: [String], required: false },
    pairingValues: { type: [String], required: false },
    createdAt: { type: Date, default: Date.now },
});

questionTemplateSchema.index({ packId: 1 });
questionTemplateSchema.index({ category: 1 });

const QuestionTemplate =
    (mongoose.models.QuestionTemplate as mongoose.Model<IQuestionTemplate>) ||
    mongoose.model<IQuestionTemplate>("QuestionTemplate", questionTemplateSchema);

export default QuestionTemplate;
