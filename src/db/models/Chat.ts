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
    messages: [messageSchema], // Array of messages
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
