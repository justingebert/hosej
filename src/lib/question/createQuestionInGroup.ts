import { QuestionType } from "@/types/models/question";
import Question from "@/db/models/Question";
import Chat from "@/db/models/Chat";
import { Types } from "mongoose";

export async function createQuestionInGroup(
    groupId: string | Types.ObjectId,
    category: string,
    questionType: QuestionType,
    question: string,
    image: string,
    options: any[] | null | undefined,
    submittedBy: string | Types.ObjectId | null = null,
    templateId?: Types.ObjectId
) {
    let finalOptions = options || [];

    if (questionType.startsWith("rating") && finalOptions.length === 0) {
        finalOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
        groupId: groupId,
        category: category,
        questionType: questionType,
        question: question,
        image: image,
        options: finalOptions,
        submittedBy: submittedBy,
        templateId: templateId,
    });

    await newQuestion.save();

    // Create and link chat for the question
    const newChat = new Chat({
        group: groupId,
        entity: newQuestion._id,
        entityModel: "Question",
        messages: [],
    });

    await newChat.save();
    newQuestion.chat = newChat._id;
    await newQuestion.save();

    return newQuestion;
}
