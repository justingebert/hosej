import mongoose, { Schema } from "mongoose";
import { IAppConfig } from "@/types/models/appConfig";

const appConfigSchema = new Schema<IAppConfig>({
    configKey: {
        type: String,
        required: true,
        unique: true,
        default: "global_features"
    },
    features: {
        questions: {
            status: {
                type: String,
                enum: ['enabled', 'disabled', 'comingSoon'],
                default: 'enabled'
            }
        },
        rallies: {
            status: {
                type: String,
                enum: ['enabled', 'disabled', 'comingSoon'],
                default: 'enabled'
            }
        },
        jukebox: {
            status: {
                type: String,
                enum: ['enabled', 'disabled', 'comingSoon'],
                default: 'enabled'
            }
        },
    },
    adminUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

appConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const AppConfig = mongoose.models.AppConfig as mongoose.Model<IAppConfig> || mongoose.model<IAppConfig>("AppConfig", appConfigSchema);

export default AppConfig;