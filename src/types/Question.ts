import mongoose from "mongoose";

export interface IQuestion extends mongoose.Document {
  _id: mongoose.Schema.Types.ObjectId | string;
  groupId: mongoose.Schema.Types.ObjectId | string;
  category: string;
  questionType: QuestionType;
  question: string;
  options?: any;
  answers: [{ user: mongoose.Schema.Types.ObjectId; response: any; time: Date; }];
  rating: {
    good: mongoose.Schema.Types.ObjectId[];
    ok: mongoose.Schema.Types.ObjectId[];
    bad: mongoose.Schema.Types.ObjectId[];
  };
  createdAt: Date;
  used: boolean;
  usedAt: Date
  active: boolean;
  submittedBy: mongoose.Schema.Types.ObjectId;
  chat: mongoose.Schema.Types.ObjectId;
}

export enum QuestionType {
  UsersSelectOne = "users-select-one",
//   UsersSelectMultiple = "users-select-multiple",
  CustomSelectOne = "custom-select-one",
//   CustomSelectMultiple = "custom-select-multiple",
  Text = "text",
  Rating = "rating",
  ImageSelectOne = "image-select-one"
}
