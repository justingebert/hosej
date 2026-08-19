import { z } from "zod";
import { ReportTargetType } from "@/types/models/report";

export const CreateReportSchema = z.object({
    targetType: z.enum(ReportTargetType),
    targetId: z.string().min(1).max(200),
    reportedUser: z.string().length(24).optional(),
    groupId: z.string().length(24).optional(),
    content: z.string().max(2000).optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
