import { z } from "zod";
import { QuestionType } from "@/types/models/question";

export const CreateQuestionSchema = z.object({
    category: z.string().min(1, "category is required").max(100),
    questionType: z.nativeEnum(QuestionType),
    question: z.string().min(1, "question is required").max(500),
    submittedBy: z.string().min(1),
    image: z.string().optional(),
    options: z.array(z.unknown()).optional(),
});

export const UpdateQuestionAttachmentsSchema = z.object({
    imageUrl: z.string().optional(),
});

export const VoteOnQuestionSchema = z.object({
    response: z.unknown(),
});

export const RateQuestionSchema = z.object({
    rating: z.enum(["good", "ok", "bad"]),
});
