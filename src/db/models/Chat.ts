import mongoose from "mongoose";

export interface IMessage {
    user: string;
    message: string;
    createdAt: Date;
}

export interface IChat {
    group: string;
    messages: IMessage[];
    entity: string;
    entityModel: string;
    createdAt: Date;
}

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    messages: [messageSchema], // Array of messages
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityModel'
    },
    entityModel: {
        type: String,
        required: true,
        enum: ['Question', 'Rally', 'Jukebox'] //other entities that the chat can be attached to
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
