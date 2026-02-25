import { z } from "zod";
import { QuestionType } from "@/types/models/question";

export { UpdateAdminConfigSchema } from "./groups";

export const BulkCreateTemplatesSchema = z.object({
    packId: z.string().min(1, "packId is required"),
    templates: z.array(
        z.object({
            category: z.string().min(1),
            questionType: z.enum(QuestionType),
            question: z.string().min(1),
            options: z.array(z.unknown()).optional(),
        })
    ),
});
