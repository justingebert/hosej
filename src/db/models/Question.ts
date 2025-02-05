import { QuestionType, IQuestion } from "@/types/Question";
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
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
  answers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      response: { type: mongoose.Schema.Types.Mixed, required: true },
      time: { type: Date },
    },
  ],
  rating: {
    good: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    ok: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bad: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  createdAt: { type: Date, default: Date.now },
  usedAt: { type: Date },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
});

questionSchema.index({ groupId: 1 });

const Question = mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
