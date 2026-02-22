import QuestionTemplate from "@/db/models/QuestionTemplate";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { QuestionType } from "@/types/models/question";
import { createQuestionFromTemplate } from "./question";
import { validateTemplates } from "./validateTemplateQuestions";
import type { Types } from "mongoose";

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { validateTemplates, formatValidationErrors } from "./validateTemplateQuestions";
export type { TemplateInput, ValidationResult } from "./validateTemplateQuestions";

// ─── Template CRUD ──────────────────────────────────────────────────────────

export async function createTemplatesFromArray(
    packId: string,
    templates: { category: string; questionType: string; question: string; options?: unknown[] }[]
): Promise<{
    loaded: number;
    skipped: number;
    errors: { index: number; field: string; message: string }[];
}> {
    let loaded = 0;
    let skipped = 0;

    if (!packId || packId.trim() === "") {
        throw new ValidationError("packId is required and cannot be empty");
    }

    const validationResult = validateTemplates(templates);

    if (!validationResult.valid) {
        return {
            loaded: 0,
            skipped: templates.length,
            errors: validationResult.errors,
        };
    }

    const errors: { index: number; field: string; message: string }[] = [];
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        try {
            const newTemplate = new QuestionTemplate({
                packId,
                category: template.category.trim(),
                questionType: template.questionType as QuestionType,
                question: template.question.trim(),
                options: template.options || [],
            });
            await newTemplate.save();
            loaded++;
        } catch (error) {
            errors.push({
                index: i,
                field: "database",
                message: error instanceof Error ? error.message : String(error),
            });
            skipped++;
        }
    }

    return { loaded, skipped, errors };
}

export async function addTemplatePackToGroup(
    groupId: string | Types.ObjectId,
    packId: string
): Promise<void> {
    const templates = await QuestionTemplate.find({ packId });

    if (templates.length === 0) {
        throw new NotFoundError(`No templates found for pack "${packId}"`);
    }

    for (const template of templates) {
        await createQuestionFromTemplate(
            groupId,
            template.category,
            template.questionType,
            template.question,
            "",
            template.options,
            template._id
        );
    }
}
