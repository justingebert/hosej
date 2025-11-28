import mongoose from "mongoose";
import Chat from "../models/Chat";
import Question from "../models/Question";

async function migrateQuestionsWithoutChats() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hosej'); // Update with your MongoDB URI

        // Find all questions that do not have an associated chat
        const questionsWithoutChats = await Question.find({chat: {$exists: false}});

        for (const question of questionsWithoutChats) {
            console.log(`Processing question ${question._id}`);

            // Create a new Chat document
            const newChat = new Chat({
                group: question.groupId,
                entity: question._id,
                entityModel: "Question", // Specify the entity model as 'Question'
                messages: [], // Initialize with no messages
            });

            await newChat.save();

            // Update the Question with the new chatId
            question.chat = newChat._id;
            await question.save();

            console.log(`Updated question ${question._id} with chatId ${newChat._id}`);
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        mongoose.connection.close();
    }
}

migrateQuestionsWithoutChats();
