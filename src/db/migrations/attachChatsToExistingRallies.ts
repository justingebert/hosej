import mongoose from "mongoose";
//import ChatMessage from "../models/chatmessage";
import Chat from "../models/Chat";
import Rally from "../models/rally";

async function migrateChatMessages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hosej'); // Update with your MongoDB URI

        const rallies = await Rally.find({});
        console.log(rallies)
        console.log('Migrating chat messages...');
            for (const rally of rallies) {
                const newChat = new Chat({
                    group: rally.groupId,
                    entity: rally._id,
                    entityModel: 'Rally',
                    messages: [],
                });

                await newChat.save();

                rally.chat = newChat._id;
                await rally.save();

                console.log(`Updated rally ${rally._id} with chatId ${newChat._id}`);
            }

            console.log('Migration complete!');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        mongoose.connection.close();
    }
}

migrateChatMessages();
