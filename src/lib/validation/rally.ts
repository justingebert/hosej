import { z } from "zod";

export const CreateRallySchema = z.object({
    task: z.string().min(1, "task is required").max(300),
    lengthInDays: z.number().int().min(1).max(365),
});

export const AddRallySubmissionSchema = z.object({
    imageUrl: z.string().min(1, "imageUrl is required"),
});
