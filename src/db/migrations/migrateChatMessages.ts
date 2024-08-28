import mongoose from "mongoose";
import ChatMessage from "./models/ChatMessage";  // Path to your old ChatMessage model
import Chat from "./models/Chat";  // Path to your new Chat model
import Question from "./models/Question";  // Path to your Question model

async function migrateChatMessages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourdatabase'); // Update with your MongoDB URI

        // Fetch all unique questions from the old ChatMessage collection
        const chatMessages = await ChatMessage.find({});
        const messagesGroupedByQuestion = chatMessages.reduce((acc, message) => {
            if (!acc[message.question]) {
                acc[message.question] = [];
            }
            acc[message.question].push({
                user: message.user,
                message: message.message,
                createdAt: message.createdAt,
            });
            return acc;
        }, {});

        // Create new Chat documents and update Questions
        for (const questionId in messagesGroupedByQuestion) {
            if (Object.hasOwn(messagesGroupedByQuestion, questionId)) {
                const messages = messagesGroupedByQuestion[questionId];

                // Create a new Chat document with the grouped messages
                const newChat = new Chat({
                    messages: messages,
                    createdAt: messages[0]?.createdAt, // Use the first message's creation date
                });
                await newChat.save();

                // Update the corresponding Question with the new chatId
                await Question.findByIdAndUpdate(questionId, { chatId: newChat._id });
            }
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        mongoose.connection.close();
    }
}

migrateChatMessages();
