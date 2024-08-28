import { count, time } from "console";
import mongoose from "mongoose";

enum QuestionType {
  UsersSelectOne = "users-select-one",
  UsersSelectMultiple = "users-select-multiple",
  CustomSelectOne = "custom-select-one",
  CustomSelectMultiple = "custom-select-multiple",
  Text = "text", 
  Rating = "rating",
  MatchPairs = "match-pairs",
  Sequence = "sequence",
}

export interface IQuestion extends mongoose.Document {
  category: string;
  questionType: QuestionType;
  question: string;
  options?: any;
  answers: [{ userId: mongoose.Schema.Types.ObjectId; response: any, time: Date}];
  rating: {
    good: { count: number, username: string},
    ok: { count: number, username: string},
    bad: { count: number, username: string},
  };
  createdAt: Date;
  used: boolean;
  active: boolean;
  submittedBy: String
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
  options: { type: mongoose.Schema.Types.Mixed, required: false },
  answers: [
    {
      username: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
      response: { type: mongoose.Schema.Types.Mixed, required: true},
      time:     { type: Date},
    },
  ],
  rating: { 
    good: { count:{type: Number, default: 0}, usernames: [String]},
    ok: {count:{type: Number, default: 0}, usernames: [String]},
    bad: {count:{type: Number, default: 0}, usernames: [String]},
  },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  submittedBy: {type: String},
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
});

questionSchema.index({ groupId: 1, createdAt: -1 });

const Question = mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
