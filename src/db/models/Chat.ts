import { IChat } from "@/types/models/chat";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
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

const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
