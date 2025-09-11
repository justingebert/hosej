import mongoose, { Types } from "mongoose";
import { ToDTO } from "@/types/common";

export interface IMessage {
    user: Types.ObjectId | string;
    message: string;
    createdAt: Date;
}

enum EntityModel {
    Question = "Question",
    Rally = "Rally",
    Jukebox = "Jukebox",
}

export interface IChat {
    _id: Types.ObjectId;
    group: Types.ObjectId;
    messages: IMessage[];
    entity: Types.ObjectId;
    entityModel: EntityModel;
    createdAt: Date;
}


const messageSchema = new mongoose.Schema<IMessage>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const chatSchema = new mongoose.Schema<IChat>({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    messages: [messageSchema],
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "entityModel",
    },
    entityModel: {
        type: String,
        required: true,
        enum: ["Question", "Rally", "Jukebox"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export type ChatDTO = ToDTO<IChat>;

const Chat = mongoose.models.Chat as mongoose.Model<IChat> || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
