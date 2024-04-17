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

interface IQuestion extends mongoose.Document {
  category: string;
  questionType: QuestionType;
  question: string;
  options?: any;
  answers: [{ userId: mongoose.Schema.Types.ObjectId; response: any }];
  createdAt: Date;
  used: boolean;
}

const questionSchema = new mongoose.Schema({
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
      username: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
      response: { type: mongoose.Schema.Types.Mixed, required: true},
    },
  ],
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
});

const Question = mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
