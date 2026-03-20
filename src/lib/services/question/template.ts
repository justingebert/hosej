import QuestionTemplate from "@/db/models/QuestionTemplate";
import QuestionPack from "@/db/models/QuestionPack";
import Group from "@/db/models/Group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { QuestionType } from "@/types/models/question";
import type { IQuestionPack } from "@/types/models/questionPack";
import { createQuestionFromTemplate } from "./question";
import { validateTemplates } from "./validateTemplateQuestions";
import type { Types } from "mongoose";

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { validateTemplates, formatValidationErrors } from "./validateTemplateQuestions";
export type { TemplateInput, ValidationResult } from "./validateTemplateQuestions";

// ─── Template CRUD ──────────────────────────────────────────────────────────

export async function createTemplatesFromArray(
    packId: string,
    templates: {
        category: string;
        questionType: string;
        question: string;
        multiSelect?: boolean;
        options?: unknown[];
        pairingKeySource?: string;
        pairingMode?: string;
        pairingKeys?: string[];
    }[],
    packMeta?: { name?: string; description?: string; category?: string }
): Promise<{
    loaded: number;
    errors: { index: number; field: string; message: string }[];
}> {
    if (!packId || packId.trim() === "") {
        throw new ValidationError("packId is required and cannot be empty");
    }

    const validationResult = validateTemplates(templates);

    if (!validationResult.valid) {
        return {
            loaded: 0,
            errors: validationResult.errors,
        };
    }

    // Build all documents upfront, then insert atomically
    const docs = templates.map((t) => ({
        packId,
        category: t.category.trim(),
        questionType: t.questionType as QuestionType,
        question: t.question.trim(),
        multiSelect: t.multiSelect ?? false,
        options: t.options || [],
        ...(t.pairingKeySource && { pairingKeySource: t.pairingKeySource }),
        ...(t.pairingMode && { pairingMode: t.pairingMode }),
        ...(t.pairingKeys && { pairingKeys: t.pairingKeys }),
    }));

    const inserted = await QuestionTemplate.insertMany(docs);

    // Only create/update the QuestionPack after all templates succeeded
    const totalCount = await QuestionTemplate.countDocuments({ packId });
    await QuestionPack.findOneAndUpdate(
        { packId },
        {
            $set: {
                packId,
                name: packMeta?.name || packId,
                description: packMeta?.description || "",
                category: packMeta?.category || "",
                questionCount: totalCount,
            },
        },
        { upsert: true }
    );

    return { loaded: inserted.length, errors: [] };
}

export async function addTemplatePackToGroup(
    groupId: string | Types.ObjectId,
    packId: string
): Promise<void> {
    // Check if pack is already added to this group
    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found");
    }

    const existingPacks = group.features.questions.settings.packs || [];
    if (existingPacks.includes(packId)) {
        throw new ConflictError(`Pack "${packId}" is already added to this group`);
    }

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
            template._id,
            {
                multiSelect: template.multiSelect,
                pairingKeySource: template.pairingKeySource,
                pairingMode: template.pairingMode,
                pairingKeys: template.pairingKeys,
            }
        );
    }

    // Track the pack on the group
    await Group.findByIdAndUpdate(groupId, {
        $push: { "features.questions.settings.packs": packId },
    });
}

// ─── Pack queries ───────────────────────────────────────────────────────────

export async function getAvailablePacks(): Promise<IQuestionPack[]> {
    return QuestionPack.find().sort({ name: 1 }).lean();
}

export async function getGroupPacks(
    groupId: string
): Promise<(IQuestionPack & { added: boolean })[]> {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found");
    }

    const addedPacks = group.features.questions.settings.packs || [];
    const allPacks = await QuestionPack.find().sort({ name: 1 }).lean();

    return allPacks.map((pack) => ({
        ...pack,
        added: addedPacks.includes(pack.packId),
    }));
}
