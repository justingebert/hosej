import Question from "@/db/models/Question";
import { Types } from "mongoose";
import { populateUserOptions } from "./populateUserOptions";
import { IQuestion } from "@/types/models/question";

/**
 * deactives current questions and activates new ones
 * @param groupId 
 * @param limit 
 * @returns Promise<IQuestion[]> the activated questions
 */
export async function activateNextQuestions(groupId: Types.ObjectId, limit: number, category?: string): Promise<IQuestion[]> {
    const categoryFilter = category ? { category } : {};

    const currentQuestions = await Question.find({
        groupId: groupId,
        active: true,
        ...categoryFilter
    });

    for (const question of currentQuestions) {
        question.active = false;
        await question.save();
    }

    const questions = await Question.find({
        groupId: groupId,
        used: false,
        active: false,
        ...categoryFilter
    })
        .sort({ createdAt: 1 })
        .limit(limit);

    for (const question of questions) {
        // Populate user options if it's a users-* question type
        // This ensures the member list is current at activation time
        await populateUserOptions(question);

        question.active = true;
        question.used = true;
        question.usedAt = new Date();
        await question.save();
    }

    return questions;
}