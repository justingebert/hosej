import QuestionTemplate from "@/db/models/QuestionTemplate";
import type { Types } from "mongoose";
import { NotFoundError } from "@/lib/api/errorHandling";
import { createQuestionInGroup } from "@/lib/question/createQuestion";

/**
 * Add all templates from a pack to a group as real questions
 */
export async function addTemplatePackToGroup(
    groupId: string | Types.ObjectId,
    packId: string
): Promise<void> {
    const templates = await QuestionTemplate.find({ packId });

    if (templates.length === 0) {
        throw new NotFoundError(`No templates found for pack "${packId}"`);
    }

    for (const template of templates) {
        await createQuestionInGroup(
            groupId,
            template.category,
            template.questionType,
            template.question,
            "",
            template.options,
            null,
            template._id
        );
    }
}
