//migrate questions to awlays beeing populated iwth options

import Question from "@/db/models/Question";
import User from "@/db/models/user";

// Migration script to update existing questions
export async function migrateQuestions() {
    // Find questions that don't have any answers yet
    const questionsToUpdate = await Question.find({
        answers: {$size: 0},
    });

    for (const question of questionsToUpdate) {
        if (question.questionType.startsWith("users-")) {
            // Fetch all users for the group
            const users = await User.find({groupId: question.groupId});
            question.options = users.map((user) => user.username);
        } else if (question.questionType.startsWith("rating")) {
            // Set options as rating scale 1 to 10
            question.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        }

        // Save the updated question
        await question.save();
    }

    return `Migrated ${questionsToUpdate.length} questions`;
}
