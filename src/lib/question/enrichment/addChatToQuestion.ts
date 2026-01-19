import { HydratedDocument, Types } from "mongoose";
import { IQuestion } from "@/types/models/question";
import Chat from "@/db/models/Chat";

export async function addChatToQuestion(groupId: string | Types.ObjectId, question: HydratedDocument<IQuestion>) {
    const newChat = new Chat({
        group: groupId,
        entity: question._id,
        entityModel: "Question",
        messages: [],
    });

    await newChat.save();
    question.chat = newChat._id;
    await question.save();
}