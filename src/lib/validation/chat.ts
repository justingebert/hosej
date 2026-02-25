import { z } from "zod";

export const AddMessageSchema = z.object({
    message: z.string().min(1, "message is required").max(5000),
});
