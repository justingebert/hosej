import { z } from "zod";

export const UploadImageSchema = z.object({
    filename: z.string().min(1, "filename is required"),
    contentType: z.string().refine((val) => val.startsWith("image/"), {
        message: "contentType must start with image/",
    }),
    groupId: z.string().min(1, "groupId is required"),
    entity: z.string().min(1, "entity is required"),
    entityId: z.string().min(1, "entityId is required"),
});
