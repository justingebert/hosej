import { Types } from "mongoose";
import { ToDTO } from "../common";

export type FeatureStatus = 'enabled' | 'disabled' | 'comingSoon';

export interface IAppConfig {
    _id: Types.ObjectId;
    configKey: string;
    features: {
        questions: { status: FeatureStatus };
        rallies: { status: FeatureStatus };
        jukebox: { status: FeatureStatus };
    };
    adminUsers: Types.ObjectId[];
    updatedAt: Date;
}

export type AppConfigDTO = ToDTO<IAppConfig>;

