import mongoose from "mongoose";
import { QuestionPackStatus, type IQuestionPack } from "@/types/models/questionPack";

const questionPackSchema = new mongoose.Schema<IQuestionPack>({
    packId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    questionCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: Object.values(QuestionPackStatus),
        default: QuestionPackStatus.Active,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
});

questionPackSchema.index({ packId: 1 }, { unique: true });
questionPackSchema.index({ status: 1 });

const QuestionPack =
    (mongoose.models.QuestionPack as mongoose.Model<IQuestionPack>) ||
    mongoose.model<IQuestionPack>("QuestionPack", questionPackSchema);

export default QuestionPack;
