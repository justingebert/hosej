import mongoose from "mongoose";
import { IAnswer, IQuestion, QuestionType } from "@/types/models/question";

const answerSchema = new mongoose.Schema<IAnswer>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
    time: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema<IQuestion>(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        category: { type: String },
        questionType: {
            type: String,
            enum: Object.values(QuestionType),
            required: true,
        },
        question: { type: String, required: true },
        image: { type: String, required: false },
        options: { type: mongoose.Schema.Types.Mixed, required: false },
        answers: [answerSchema],
        rating: {
            good: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            ok: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            bad: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
        used: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
        usedAt: { type: Date },
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        createdAt: { type: Date, default: Date.now },
    }
);

questionSchema.index({ groupId: 1 });

const Question = mongoose.models.Question as mongoose.Model<IQuestion> || mongoose.model<IQuestion>("Question", questionSchema);

export default Question;