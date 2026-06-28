import mongoose, { Schema } from "mongoose";
import type { IPushToken } from "@/types/models/pushToken";
import { PUSH_PLATFORMS } from "@/types/models/pushToken";

const PushTokenSchema = new Schema<IPushToken>({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    platform: {
        type: String,
        enum: PUSH_PLATFORMS,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
    },
});

const PushToken =
    (mongoose.models.PushToken as mongoose.Model<IPushToken>) ||
    mongoose.model<IPushToken>("PushToken", PushTokenSchema);

export default PushToken;
