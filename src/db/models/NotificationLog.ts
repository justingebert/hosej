import mongoose, { Schema } from "mongoose";
import {
    ReminderCategory,
    ReminderEntityType,
    type INotificationLog,
} from "@/types/models/notificationLog";

const NotificationLogSchema = new Schema<INotificationLog>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    category: {
        type: String,
        enum: Object.values(ReminderCategory),
        required: true,
    },
    entityType: {
        type: String,
        enum: Object.values(ReminderEntityType),
        required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    sentAt: { type: Date, default: Date.now },
});

// Hard dedupe: a (user, category, entity) triple can only exist once.
NotificationLogSchema.index({ userId: 1, category: 1, entityId: 1 }, { unique: true });

// Daily-cap counting.
NotificationLogSchema.index({ userId: 1, sentAt: -1 });

// Auto-prune — 60 days comfortably outlives the longest rally.
NotificationLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const NotificationLog =
    (mongoose.models.NotificationLog as mongoose.Model<INotificationLog>) ||
    mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema);

export default NotificationLog;
