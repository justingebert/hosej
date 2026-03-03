import mongoose from "mongoose";
import type { IQuestionPack } from "@/types/models/questionPack";

const questionPackSchema = new mongoose.Schema<IQuestionPack>({
    packId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    questionCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

questionPackSchema.index({ packId: 1 }, { unique: true });

const QuestionPack =
    (mongoose.models.QuestionPack as mongoose.Model<IQuestionPack>) ||
    mongoose.model<IQuestionPack>("QuestionPack", questionPackSchema);

export default QuestionPack;
