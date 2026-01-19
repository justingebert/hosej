import Group from "@/db/models/Group";
import Question from "@/db/models/Question";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IQuestion } from "@/types/models/question";

/**
 * Populate user options for questions with "users-" question types
 * This should be called when activating questions in the cron job
 * @param question - The question document to populate
 * @returns The updated question with user options populated
 */
export async function populateUserOptions(
    question: HydratedDocument<IQuestion>
): Promise<HydratedDocument<IQuestion>> {
    if (!question.questionType.startsWith("users-")) {
        return question;
    }

    const group = await Group.findById(question.groupId).orFail();
    const userOptions = group.members.map((member: any) => member.name);

    question.options = userOptions;
    await question.save();

    return question;
}
