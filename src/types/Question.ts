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
  image?: string;
  imageUrl?: string;
}

export enum QuestionType {
  UsersSelectOne = "users-select-one",
  UsersSelectMultiple = "users-select-multiple",
  CustomSelectOne = "custom-select-one",
  CustomSelectMultiple = "custom-select-multiple",
  Text = "text",
  Rating = "rating",
  ImageSelectOne = "image-select-one",
  ImageSelectMultiple = "image-select-multiple",
  CollectAndVoteOne = "collect-and-vote-one",
  CollectAndVoteMultiple = "collect-and-vote-multiple",
}

export interface IResult {
  option: string;
  count: number;
  percentage: number;
  users: string[];
}