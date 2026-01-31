import QuestionTemplate from "@/db/models/QuestionTemplate";
import { QuestionType } from "@/types/models/question";
import { validateTemplates, type TemplateInput, type ValidationError } from "./validateTemplateQuestions";

/**
 * Validate and create multiple question templates from an array
 * @param packId - The pack identifier for all templates
 * @param templates - Array of template objects
 * @returns Result with counts and any validation errors
 */
export async function createQuestionTemplatesFromArray(
    packId: string,
    templates: TemplateInput[],
): Promise<{ loaded: number; skipped: number; errors: ValidationError[] }> {
    let loaded = 0;
    let skipped = 0;

    // Validate packId
    if (!packId || packId.trim() === "") {
        throw new Error("packId is required and cannot be empty");
    }

    // Validate templates using shared validation function
    const validationResult = validateTemplates(templates);

    if (!validationResult.valid) {
        // If validation failed, return errors without creating anything
        return {
            loaded: 0,
            skipped: templates.length,
            errors: validationResult.errors
        };
    }

    // Create each template (validation already passed)
    const errors: ValidationError[] = [];
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
                message: error instanceof Error ? error.message : String(error)
            });
            skipped++;
        }
    }

    return { loaded, skipped, errors };
}