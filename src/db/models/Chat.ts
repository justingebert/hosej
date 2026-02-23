import mongoose from "mongoose";
import type { IChat, IMessage } from "@/types/models/chat";

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

chatSchema.index({ group: 1, entity: 1 });

const Chat =
    (mongoose.models.Chat as mongoose.Model<IChat>) || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
