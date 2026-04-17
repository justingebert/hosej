import { z } from "zod";

export const FeedbackSubmissionSchema = z.object({
    responses: z.record(
        z.string().min(1).max(64),
        z.union([z.string().max(2000), z.number().finite(), z.boolean()])
    ),
});

export type FeedbackSubmission = z.infer<typeof FeedbackSubmissionSchema>;
