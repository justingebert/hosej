import { z } from "zod";

const FeatureStatusSchema = z.enum(["enabled", "disabled", "comingSoon"]);

const JukeboxSettingsSchema = z
    .object({
        concurrent: z.array(z.string()),
        activationDays: z.array(z.number().int()),
    })
    .partial();

const GroupFeaturesSchema = z
    .object({
        questions: z.object({
            enabled: z.boolean(),
            settings: z
                .object({
                    questionCount: z.number().int().min(1),
                })
                .partial()
                .optional(),
        }),
        rallies: z.object({
            enabled: z.boolean(),
            settings: z
                .object({
                    rallyCount: z.number().int().min(1),
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
});

export const UpdateGroupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    features: GroupFeaturesSchema.optional(),
});

export const GroupHistoryQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(1000).default(1000),
    offset: z.coerce.number().int().min(0).default(0),
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
