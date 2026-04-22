import { z } from "zod";
import { GROUP_LANGUAGES } from "@/types/models/group";

const FeatureStatusSchema = z.enum(["enabled", "disabled", "comingSoon"]);

const JukeboxSettingsSchema = z
    .object({
        concurrent: z
            .array(z.string().trim().min(1).max(40))
            .min(1)
            .max(3)
            .refine((names) => new Set(names.map((n) => n.toLowerCase())).size === names.length, {
                message: "Jukebox names must be unique",
            }),
        activationDays: z
            .array(z.number().int().min(0).max(28))
            .transform((days) => Array.from(new Set(days)).sort((a, b) => a - b)),
    })
    .partial();

const GroupFeaturesSchema = z
    .object({
        questions: z.object({
            enabled: z.boolean(),
            settings: z
                .object({
                    questionCount: z.number().int().min(1).max(3),
                    packs: z.array(z.string()).optional(),
                })
                .partial()
                .optional(),
        }),
        rallies: z.object({
            enabled: z.boolean(),
            settings: z
                .object({
                    rallyCount: z.number().int().min(1).max(3),
                    rallyGapDays: z.number().int().min(0),
                })
                .partial()
                .optional(),
        }),
        jukebox: z.object({
            enabled: z.boolean(),
            settings: JukeboxSettingsSchema.optional(),
        }),
    })
    .partial();

export const CreateGroupSchema = z.object({
    name: z.string().min(1, "Group name is required").max(100),
    language: z.enum(GROUP_LANGUAGES).optional(),
});

export const UpdateGroupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    features: GroupFeaturesSchema.optional(),
});

export const GroupHistoryQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(1000).default(1000),
    offset: z.coerce.number().int().min(0).default(0),
    search: z.string().max(200).optional(),
});

export const UpdateAdminConfigSchema = z.object({
    features: z
        .object({
            questions: z.object({ status: FeatureStatusSchema }).optional(),
            rallies: z.object({ status: FeatureStatusSchema }).optional(),
            jukebox: z.object({ status: FeatureStatusSchema }).optional(),
        })
        .optional(),
});
