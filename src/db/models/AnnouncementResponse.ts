import mongoose, { Schema } from "mongoose";
import type { IAnnouncementResponse } from "@/types/models/announcementResponse";

const AnnouncementResponseSchema = new Schema<IAnnouncementResponse>(
    {
        announcementId: { type: String, required: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        responses: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

AnnouncementResponseSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

const AnnouncementResponse =
    (mongoose.models.AnnouncementResponse as mongoose.Model<IAnnouncementResponse>) ||
    mongoose.model<IAnnouncementResponse>("AnnouncementResponse", AnnouncementResponseSchema);

export default AnnouncementResponse;
