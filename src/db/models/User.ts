import mongoose, { Schema } from "mongoose";
import type { IUser } from "@/types/models/user";

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
    },
    groups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
    ],

    deviceId: {
        type: String,
        unique: true,
        sparse: true,
    },
    fcmToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    googleConnected: {
        type: Boolean,
        default: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    connectToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    connectTokenExpiresAt: {
        type: Date,
    },
    avatar: {
        type: String,
    },
    lastOnline: {
        type: Date,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User =
    (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
