import mongoose, { Types } from "mongoose";
import { ToDTO } from "@/types/common";

export interface IQuestion {
    _id: Types.ObjectId;
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
    // CollectAndVoteOne = "collect-and-vote-one",
    // CollectAndVoteMultiple = "collect-and-vote-multiple",
}

export interface IAnswer {
    user: Types.ObjectId;
    response: any; //Record<string, unknown> | string | number;
    time: Date;
}

export interface IResult {
    option: string;
    count: number;
    percentage: number;
    users: string[];
}


const answerSchema = new mongoose.Schema<IAnswer>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be a string, object, etc.
    time: { type: Date, default: Date.now },
});

const questionSchemaFields = {
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
const questionSchema = new mongoose.Schema<IQuestion>(questionSchemaFields);

questionSchema.index({ groupId: 1 });

const Question = mongoose.models.Question as mongoose.Model<IQuestion> || mongoose.model<IQuestion>("Question", questionSchema);

export type QuestionDTO = ToDTO<IQuestion>;
export default Question;