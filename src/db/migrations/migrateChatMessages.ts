import mongoose from "mongoose";
import ChatMessage from "../models/chatmessage";
import Chat from "../models/Chat";
import Question from "../models/Question";

async function migrateChatMessages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hosej'); // Update with your MongoDB URI

        // Fetch all ChatMessage documents
        const chatMessages = await ChatMessage.find({});
        
        // Group messages by questionId
        const messagesGroupedByQuestion = chatMessages.reduce((acc, message) => {
            const questionIdStr = message.question.toString(); // Convert ObjectId to string
            if (!acc[questionIdStr]) {
                acc[questionIdStr] = [];
            }
            acc[questionIdStr].push({
                user: message.user,
                message: message.message,
                createdAt: message.createdAt,
            });
            return acc;
        }, {});

        // Process each group
        for (const questionIdStr in messagesGroupedByQuestion) {
            if (Object.prototype.hasOwnProperty.call(messagesGroupedByQuestion, questionIdStr)) {
                const messages = messagesGroupedByQuestion[questionIdStr];

                // Fetch the question associated with this group
                const question = await Question.findById(questionIdStr);
                if (!question) {
                    console.warn(`Question not found for id: ${questionIdStr}`);
                    continue; // Skip this iteration if the question doesn't exist
                }

                // Create a new Chat document with the grouped messages
                const newChat = new Chat({
                    group: question.groupId,
                    entity: question._id,
                    entityModel: 'Question',
                    messages: messages,
                    createdAt: messages[0]?.createdAt, // Use the first message's creation date
                });

                await newChat.save();

                // Update the Question with the new chatId
                question.chat = newChat._id;
                await question.save();

                console.log(`Updated question ${questionIdStr} with chatId ${newChat._id}`);
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
