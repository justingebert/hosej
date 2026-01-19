import QuestionTemplate from "@/db/models/QuestionTemplate";
import { createQuestionInGroup } from "../core/createQuestionInGroup";
import { Types } from "mongoose";
import { NotFoundError } from "@/lib/api/errorHandling";

/**
 * Add all templates from a pack to a group as real questions
 */
export async function addTemplatePackToGroup(
    groupId: string | Types.ObjectId,
    packId: string,
): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    const templates = await QuestionTemplate.find({ packId });

    if (templates.length === 0) {
        throw new NotFoundError(`No templates found for pack "${packId}"`);
    }

    for (const template of templates) {
        try {
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

            created++;
        } catch (error) {
            errors.push(`Question "${template.question.substring(0, 50)}...": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return { created, errors };
}