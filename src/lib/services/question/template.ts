import QuestionTemplate from "@/db/models/QuestionTemplate";
import QuestionPack from "@/db/models/QuestionPack";
import Group from "@/db/models/Group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { QuestionType } from "@/types/models/question";
import { QuestionPackStatus, type IQuestionPack } from "@/types/models/questionPack";
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
        pairing?: {
            keySource: string;
            mode: string;
            keys?: string[];
            values: string[];
        };
    }[],
    packMeta?: { name?: string; description?: string; category?: string; tags?: string[] }
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
        ...(t.pairing && { pairing: t.pairing }),
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
                tags: packMeta?.tags ?? [],
                questionCount: totalCount,
            },
            $setOnInsert: { status: QuestionPackStatus.Active },
        },
        { upsert: true }
    );

    return { loaded: inserted.length, errors: [] };
}

export async function addTemplatePackToGroup(
    groupId: string | Types.ObjectId,
    packId: string
): Promise<void> {
    const pack = await QuestionPack.findOne({ packId });
    if (!pack) {
        throw new NotFoundError(`Pack "${packId}" not found`);
    }
    if (pack.status !== QuestionPackStatus.Active) {
        throw new ValidationError(`Pack "${packId}" is not active and cannot be added`);
    }

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
                pairing: template.pairing,
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
    return QuestionPack.find({ status: QuestionPackStatus.Active }).sort({ name: 1 }).lean();
}

export async function getAllPacks(): Promise<IQuestionPack[]> {
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

    // Show active packs + any packs the group already has (even if deprecated/archived)
    const visiblePacks = await QuestionPack.find({
        $or: [{ status: QuestionPackStatus.Active }, { packId: { $in: addedPacks } }],
    })
        .sort({ name: 1 })
        .lean();

    return visiblePacks.map((pack) => ({
        ...pack,
        added: addedPacks.includes(pack.packId),
    }));
}

// ─── Pack lifecycle ─────────────────────────────────────────────────────────

export async function updatePackStatus(
    packId: string,
    status: QuestionPackStatus
): Promise<IQuestionPack> {
    if (!Object.values(QuestionPackStatus).includes(status)) {
        throw new ValidationError(`Invalid pack status: ${status}`);
    }

    const updated = await QuestionPack.findOneAndUpdate(
        { packId },
        { $set: { status } },
        { new: true }
    ).lean();

    if (!updated) {
        throw new NotFoundError(`Pack "${packId}" not found`);
    }

    return updated;
}

export async function updatePack(
    packId: string,
    updates: { status?: QuestionPackStatus; tags?: string[] }
): Promise<IQuestionPack> {
    const set: Record<string, unknown> = {};
    if (updates.status !== undefined) {
        if (!Object.values(QuestionPackStatus).includes(updates.status)) {
            throw new ValidationError(`Invalid pack status: ${updates.status}`);
        }
        set.status = updates.status;
    }
    if (updates.tags !== undefined) {
        set.tags = Array.from(new Set(updates.tags.map((t) => t.trim()).filter(Boolean)));
    }

    const updated = await QuestionPack.findOneAndUpdate(
        { packId },
        { $set: set },
        { new: true }
    ).lean();

    if (!updated) {
        throw new NotFoundError(`Pack "${packId}" not found`);
    }

    return updated;
}

/**
 * Hard-delete a pack and its templates, and remove the pack reference from all groups.
 * Historical Question.templateId values are left dangling by design — they stay as
 * metadata on past questions but no longer resolve to a template.
 */
export async function deletePack(packId: string): Promise<{
    templatesDeleted: number;
    groupsUpdated: number;
}> {
    const pack = await QuestionPack.findOne({ packId });
    if (!pack) {
        throw new NotFoundError(`Pack "${packId}" not found`);
    }

    const templateResult = await QuestionTemplate.deleteMany({ packId });

    const groupResult = await Group.updateMany(
        { "features.questions.settings.packs": packId },
        { $pull: { "features.questions.settings.packs": packId } }
    );

    await QuestionPack.deleteOne({ packId });

    return {
        templatesDeleted: templateResult.deletedCount ?? 0,
        groupsUpdated: groupResult.modifiedCount ?? 0,
    };
}
