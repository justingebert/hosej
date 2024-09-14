import mongoose from "mongoose";

enum QuestionType {
  UsersSelectOne = "users-select-one",
  UsersSelectMultiple = "users-select-multiple",
  CustomSelectOne = "custom-select-one",
  CustomSelectMultiple = "custom-select-multiple",
  Text = "text",
  Rating = "rating",
  ImageSelectOne = "image-select-one",
}

export interface IQuestion extends mongoose.Document {
  category: string;
  questionType: QuestionType;
  question: string;
  options?: any;
  answers: [{ user: mongoose.Schema.Types.ObjectId; response: any; time: Date }];
  rating: {
    good: mongoose.Schema.Types.ObjectId[];
    ok: mongoose.Schema.Types.ObjectId[];
    bad: mongoose.Schema.Types.ObjectId[];
  };
  createdAt: Date;
  used: boolean;
  active: boolean;
  submittedBy: mongoose.Schema.Types.ObjectId;
}

const questionSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: false,
  },
  category: { type: String },
  questionType: {
    type: String,
    required: true,
    enum: Object.values(QuestionType),
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
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
});

questionSchema.index({ groupId: 1 });

const Question = mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
