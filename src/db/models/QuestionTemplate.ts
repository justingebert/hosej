import mongoose from "mongoose";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";
import type { IQuestionTemplate } from "@/types/models/questionTemplate";

const pairingSchema = new mongoose.Schema(
    {
        keySource: { type: String, enum: Object.values(PairingKeySource), required: true },
        mode: { type: String, enum: Object.values(PairingMode), required: true },
        keys: { type: [String], required: false },
        values: { type: [String], required: true },
    },
    { _id: false }
);

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
    pairing: { type: pairingSchema, required: false },
    createdAt: { type: Date, default: Date.now },
});

questionTemplateSchema.index({ packId: 1 });
questionTemplateSchema.index({ category: 1 });

const QuestionTemplate =
    (mongoose.models.QuestionTemplate as mongoose.Model<IQuestionTemplate>) ||
    mongoose.model<IQuestionTemplate>("QuestionTemplate", questionTemplateSchema);

export default QuestionTemplate;
