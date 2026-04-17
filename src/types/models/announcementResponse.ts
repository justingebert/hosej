import type { HydratedDocument, Types } from "mongoose";

export type AnnouncementResponseValue = string | number | boolean;

export interface IAnnouncementResponse {
    _id: Types.ObjectId;
    announcementId: string;
    userId: Types.ObjectId;
    responses: Record<string, AnnouncementResponseValue>;
    createdAt: Date;
    updatedAt: Date;
}

export type AnnouncementResponseDocument = HydratedDocument<IAnnouncementResponse>;
