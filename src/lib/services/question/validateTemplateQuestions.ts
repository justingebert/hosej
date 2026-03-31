import { PairingKeySource, QuestionType } from "@/types/models/question";

export interface TemplateInput {
    category: string;
    questionType: string;
    question: string;
    multiSelect?: boolean;
    options?: any[];
    pairing?: {
        keySource: string;
        mode: string;
        keys?: string[];
        values: string[];
    };
}

export interface ValidationError {
    index: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Validate an array of question templates
 * Can be used in both frontend (for pre-validation) and backend (for final validation)
 *
 * @param templates - Array of template objects to validate
 * @returns ValidationResult with valid flag and array of errors
 */
export function validateTemplates(templates: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if templates is an array
    if (!Array.isArray(templates)) {
        errors.push({
            index: -1,
            field: "templates",
            message: "Templates must be an array",
        });
        return { valid: false, errors };
    }

    if (templates.length === 0) {
        errors.push({
            index: -1,
            field: "templates",
            message: "Templates array cannot be empty",
        });
        return { valid: false, errors };
    }

    // Validate each template
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];

        // Check if template exists
        if (!template) {
            errors.push({
                index: i,
                field: "template",
                message: "Template is null or undefined",
            });
            continue;
        }

        // Validate category
        if (!template.category || typeof template.category !== "string") {
            errors.push({
                index: i,
                field: "category",
                message: "Category is required and must be a string",
            });
        }

        // Validate questionType
        if (!template.questionType || typeof template.questionType !== "string") {
            errors.push({
                index: i,
                field: "questionType",
                message: "Question type is required and must be a string",
            });
        } else if (!Object.values(QuestionType).includes(template.questionType as QuestionType)) {
            const validTypes = Object.values(QuestionType).join(", ");
            errors.push({
                index: i,
                field: "questionType",
                message: `Invalid question type "${template.questionType}". Valid types: ${validTypes}`,
            });
        }

        // Validate question
        if (!template.question || typeof template.question !== "string") {
            errors.push({
                index: i,
                field: "question",
                message: "Question text is required and must be a string",
            });
        }

        // Validate options if present
        if (
            template.options !== undefined &&
            template.options !== null &&
            !Array.isArray(template.options)
        ) {
            errors.push({
                index: i,
                field: "options",
                message: "Options must be an array if provided",
            });
        }

        // Validate multiSelect if present
        if (
            template.multiSelect !== undefined &&
            template.multiSelect !== null &&
            typeof template.multiSelect !== "boolean"
        ) {
            errors.push({
                index: i,
                field: "multiSelect",
                message: "multiSelect must be a boolean if provided",
            });
        }

        // Validate pairing fields
        if (template.questionType === QuestionType.Pairing) {
            if (!template.pairing) {
                errors.push({
                    index: i,
                    field: "pairing",
                    message: "pairing config is required for pairing questions",
                });
            } else {
                if (!template.pairing.mode) {
                    errors.push({
                        index: i,
                        field: "pairing.mode",
                        message: "pairing.mode is required for pairing questions",
                    });
                }
                if (!template.pairing.keySource) {
                    errors.push({
                        index: i,
                        field: "pairing.keySource",
                        message: "pairing.keySource is required for pairing questions",
                    });
                }
                if (
                    template.pairing.keySource === PairingKeySource.Custom &&
                    (!template.pairing.keys || template.pairing.keys.length < 2)
                ) {
                    errors.push({
                        index: i,
                        field: "pairing.keys",
                        message: "Custom pairing keys require at least 2 entries",
                    });
                }
                if (!template.pairing.values || template.pairing.values.length < 2) {
                    errors.push({
                        index: i,
                        field: "pairing.values",
                        message: "Pairing questions require at least 2 values",
                    });
                }
                if (
                    template.pairing.mode === "exclusive" &&
                    template.pairing.keys &&
                    template.pairing.values &&
                    template.pairing.values.length < template.pairing.keys.length
                ) {
                    errors.push({
                        index: i,
                        field: "pairing.values",
                        message: "Exclusive pairing requires at least as many values as keys",
                    });
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get a user-friendly error message for validation errors
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return "";

    if (errors.length === 1) {
        const err = errors[0];
        if (err.index === -1) {
            return err.message;
        }
        return `Template ${err.index}: ${err.field} - ${err.message}`;
    }

    return `${errors.length} validation errors found. First error: ${errors[0].message}`;
}
