import Question from "@/db/models/Question";
import type { Types } from "mongoose";
import { populateUserOptions } from "./populateUserOptions";
import type { IQuestion, QuestionDocument } from "@/types/models/question";

/**
 * Activates a single question: populates user options and marks as active/used
 */
async function activateQuestion(question: QuestionDocument): Promise<void> {
    await populateUserOptions(question);
    question.active = true;
    question.used = true;
    question.usedAt = new Date();
    await question.save();
}

/**
 * Deactivates all currently active questions for a group
 */
async function deactivateCurrentQuestions(groupId: Types.ObjectId): Promise<void> {
    const currentQuestions = await Question.find({
        groupId: groupId,
        active: true,
    });

    for (const question of currentQuestions) {
        question.active = false;
        await question.save();
    }
}

/**
 * Smart question activation: activates one custom (user-submitted) question
 * and one template question if available.
 *
 * Priority:
 * 1. Custom questions (submittedBy is set) - activates 1 if available
 * 2. Template questions (submittedBy is null) - activates 1 if available
 *
 * @param groupId - The group to activate questions for
 * @returns Promise<IQuestion[]> - The activated questions
 */
export async function activateSmartQuestions(groupId: Types.ObjectId): Promise<IQuestion[]> {
    // First, deactivate all current questions
    await deactivateCurrentQuestions(groupId);

    const activatedQuestions: IQuestion[] = [];

    // Find one custom question (user-submitted: submittedBy is set)
    const customQuestion = await Question.findOne({
        groupId: groupId,
        submittedBy: { $exists: true, $ne: null },
        used: false,
        active: false,
    }).sort({ createdAt: 1 });

    if (customQuestion) {
        await activateQuestion(customQuestion);
        activatedQuestions.push(customQuestion);
    }

    // Find one template question (submittedBy is null or doesn't exist)
    const templateQuestion = await Question.findOne({
        groupId: groupId,
        $or: [{ submittedBy: null }, { submittedBy: { $exists: false } }],
        used: false,
        active: false,
    }).sort({ createdAt: 1 });

    if (templateQuestion) {
        await activateQuestion(templateQuestion);
        activatedQuestions.push(templateQuestion);
    }

    return activatedQuestions;
}
