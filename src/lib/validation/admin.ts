import { z } from "zod";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";
import { QuestionPackStatus } from "@/types/models/questionPack";

export { UpdateAdminConfigSchema } from "./groups";

export const UpdatePackSchema = z
    .object({
        status: z.enum(QuestionPackStatus).optional(),
        tags: z.array(z.string().min(1)).optional(),
    })
    .refine((v) => v.status !== undefined || v.tags !== undefined, {
        message: "At least one field (status or tags) must be provided",
    });

export const BulkCreateTemplatesSchema = z.object({
    packId: z.string().min(1, "packId is required"),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string().min(1)).optional(),
    templates: z.array(
        z.object({
            category: z.string().min(1),
            questionType: z.enum(QuestionType),
            question: z.string().min(1),
            multiSelect: z.boolean().optional(),
            options: z.array(z.unknown()).optional(),
            pairing: z
                .object({
                    keySource: z.enum(PairingKeySource),
                    mode: z.enum(PairingMode),
                    keys: z.array(z.string()).optional(),
                    values: z.array(z.string()),
                })
                .optional(),
        })
    ),
});

export const AddPackToGroupSchema = z.object({
    packId: z.string().min(1, "packId is required"),
});
