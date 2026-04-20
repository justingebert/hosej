import { z } from "zod";
import { QuestionType } from "@/types/models/question";
import { QuestionPackStatus } from "@/types/models/questionPack";

export { UpdateAdminConfigSchema } from "./groups";

export const UpdatePackStatusSchema = z.object({
    status: z.enum(QuestionPackStatus),
});

export const BulkCreateTemplatesSchema = z.object({
    packId: z.string().min(1, "packId is required"),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    templates: z.array(
        z.object({
            category: z.string().min(1),
            questionType: z.enum(QuestionType),
            question: z.string().min(1),
            options: z.array(z.unknown()).optional(),
        })
    ),
});

export const AddPackToGroupSchema = z.object({
    packId: z.string().min(1, "packId is required"),
});
