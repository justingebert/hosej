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
}

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  questionType: {
    type: String,
    required: true,
    enum: Object.values(QuestionType),
  },
  question: { type: String, required: true },
  options: { type: mongoose.Schema.Types.Mixed, required: false },
  answers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      response: { type: mongoose.Schema.Types.Mixed },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
