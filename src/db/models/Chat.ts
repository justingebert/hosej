import mongoose from "mongoose";

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
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityModel'
    },
    entityModel: {
        type: String,
        required: true,
        enum: ['Question', 'Rally'] //other entities that the chat can be attached to
    },
    messages: [messageSchema]
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
