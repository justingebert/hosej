import { z } from "zod";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";

const PairingConfigSchema = z.object({
    keySource: z.nativeEnum(PairingKeySource),
    mode: z.nativeEnum(PairingMode),
    keys: z.array(z.string()).optional(),
    values: z.array(z.string()),
});

export const CreateQuestionSchema = z
    .object({
        category: z.string().min(1, "category is required").max(100),
        questionType: z.enum(QuestionType),
        question: z.string().min(1, "question is required").max(5000),
        submittedBy: z.string().min(1),
        multiSelect: z.boolean().default(false),
        image: z.string().optional(),
        options: z.array(z.unknown()).optional(),
        pairing: PairingConfigSchema.optional(),
    })
    .refine(
        (data) => {
            if (data.questionType === QuestionType.Pairing) {
                return !!data.pairing;
            }
            return true;
        },
        { message: "Pairing questions require a pairing config" }
    )
    .refine(
        (data) => {
            if (
                data.questionType === QuestionType.Pairing &&
                data.pairing?.keySource === PairingKeySource.Custom
            ) {
                return data.pairing.keys && data.pairing.keys.length >= 2;
            }
            return true;
        },
        { message: "Custom pairing keys require at least 2 entries" }
    )
    .refine(
        (data) => {
            if (data.questionType === QuestionType.Pairing) {
                return data.pairing && data.pairing.values.length >= 2;
            }
            return true;
        },
        { message: "Pairing questions require at least 2 values" }
    )
    .refine(
        (data) => {
            if (
                data.questionType === QuestionType.Pairing &&
                data.pairing?.mode === PairingMode.Exclusive &&
                data.pairing.keys
            ) {
                return data.pairing.values.length >= data.pairing.keys.length;
            }
            return true;
        },
        { message: "Exclusive pairing requires at least as many values as keys" }
    );

export const UpdateQuestionAttachmentsSchema = z.object({
    imageKey: z.string().optional(),
    options: z.array(z.unknown()).optional(),
});

export const VoteOnQuestionSchema = z.object({
    response: z.unknown(),
});

export const RateQuestionSchema = z.object({
    rating: z.enum(["good", "ok", "bad"]),
});
