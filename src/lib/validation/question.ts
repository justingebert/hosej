import { z } from "zod";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";

export const CreateQuestionSchema = z
    .object({
        category: z.string().min(1, "category is required").max(100),
        questionType: z.nativeEnum(QuestionType),
        question: z.string().min(1, "question is required").max(500),
        submittedBy: z.string().min(1),
        multiSelect: z.boolean().default(false),
        image: z.string().optional(),
        options: z.array(z.unknown()).optional(),
        pairingKeySource: z.nativeEnum(PairingKeySource).optional(),
        pairingMode: z.nativeEnum(PairingMode).optional(),
        pairingKeys: z.array(z.string()).optional(),
        pairingValues: z.array(z.string()).optional(),
    })
    .refine(
        (data) => {
            if (data.questionType === QuestionType.Pairing) {
                return !!data.pairingMode && !!data.pairingKeySource;
            }
            return true;
        },
        { message: "Pairing questions require pairingMode and pairingKeySource" }
    )
    .refine(
        (data) => {
            if (
                data.questionType === QuestionType.Pairing &&
                data.pairingKeySource === PairingKeySource.Custom
            ) {
                return data.pairingKeys && data.pairingKeys.length >= 2;
            }
            return true;
        },
        { message: "Custom pairing keys require at least 2 entries" }
    )
    .refine(
        (data) => {
            if (data.questionType === QuestionType.Pairing) {
                return data.pairingValues && data.pairingValues.length >= 2;
            }
            return true;
        },
        { message: "Pairing questions require at least 2 values" }
    );

export const UpdateQuestionAttachmentsSchema = z.object({
    imageUrl: z.string().optional(),
});

export const VoteOnQuestionSchema = z.object({
    response: z.unknown(),
});

export const RateQuestionSchema = z.object({
    rating: z.enum(["good", "ok", "bad"]),
});
