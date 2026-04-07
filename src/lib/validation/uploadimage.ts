import { z } from "zod";

export const UploadImageSchema = z.object({
    filename: z.string().min(1, "filename is required"),
    contentType: z
        .string()
        .refine((val) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(val), {
            message: "contentType must be image/jpeg, image/png, image/webp, or image/gif",
        }),
    groupId: z.string().min(1, "groupId is required"),
    entity: z.string().min(1, "entity is required"),
    entityId: z.string().min(1, "entityId is required"),
});
