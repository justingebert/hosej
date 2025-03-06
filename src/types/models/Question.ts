import { Types, Document } from "mongoose";
import { AsJson } from "../common";

export interface IAnswer {
  user: Types.ObjectId;
  response: any;//Record<string, unknown> | string | number;
  time: Date;
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
  // CollectAndVoteOne = "collect-and-vote-one",
  // CollectAndVoteMultiple = "collect-and-vote-multiple",
}

// export interface IResult {
//   option: string;
//   count: number;
//   percentage: number;
//   users: string[];
// }

export interface IQuestion extends Document {
  groupId: Types.ObjectId;
  category: string;
  questionType: QuestionType;
  question: string;
  image?: string;

  options?: any;
  answers: IAnswer[];
  rating: {
    good: Types.ObjectId[];
    ok: Types.ObjectId[];
    bad: Types.ObjectId[];
  };

  used: boolean;
  active: boolean;
  usedAt?: Date
  submittedBy: Types.ObjectId;
  
  chat?: Types.ObjectId;
  createdAt: Date;
}

export type IQuestionJson = AsJson<IQuestion>;