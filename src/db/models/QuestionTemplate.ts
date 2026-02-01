import mongoose from "mongoose";
import { QuestionType } from "@/types/models/question";
import { IQuestionTemplate } from "@/types/models/questionTemplate";

const questionTemplateSchema = new mongoose.Schema<IQuestionTemplate>(
    {
        packId: { type: String, required: true},
        category: { type: String },
        questionType: {
            type: String,
            enum: Object.values(QuestionType),
            required: true,
        },
        question: { type: String, required: true },
        options: { type: mongoose.Schema.Types.Mixed, required: false },
        createdAt: { type: Date, default: Date.now },
    }
);

questionTemplateSchema.index({ packId: 1 });
questionTemplateSchema.index({ category: 1 });

const QuestionTemplate = mongoose.models.QuestionTemplate as mongoose.Model<IQuestionTemplate> || mongoose.model<IQuestionTemplate>("QuestionTemplate", questionTemplateSchema);

export default QuestionTemplate;