import mongoose from "mongoose";
import { ActivityFeature } from "@/types/models/activityEvent";
import type { IActivityEvent } from "@/types/models/activityEvent";

const activityEventSchema = new mongoose.Schema<IActivityEvent>(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        actorUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            required: true,
        },
        feature: {
            type: String,
            required: true,
            enum: Object.values(ActivityFeature),
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Fast dashboard query: "events in this group since time T"
activityEventSchema.index({ groupId: 1, createdAt: -1 });

// Auto-delete events older than 30 days
activityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ActivityEvent =
    (mongoose.models.ActivityEvent as mongoose.Model<IActivityEvent>) ||
    mongoose.model<IActivityEvent>("ActivityEvent", activityEventSchema);

export default ActivityEvent;
