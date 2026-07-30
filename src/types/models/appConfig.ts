import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

// Feature gating is gone — every group runs every feature. This config now only
// carries the global admin list.
export interface IAppConfig {
    _id: Types.ObjectId;
    configKey: string;
    adminUsers: Types.ObjectId[];
    updatedAt: Date;
}

export type AppConfigDocument = HydratedDocument<IAppConfig>;

export type AppConfigDTO = ToDTO<IAppConfig>;
