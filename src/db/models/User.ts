import mongoose, { Schema } from "mongoose";
import type { IUser, NotificationPrefs } from "@/types/models/user";
import {
    NOTIFICATION_LANGUAGES,
    NOTIFICATION_STYLES,
    DEFAULT_NOTIFICATION_LANGUAGE,
    DEFAULT_NOTIFICATION_STYLE,
} from "@/types/models/user";

const NotificationPrefsSchema = new Schema<NotificationPrefs>(
    {
        questionNew: { type: Boolean, default: true },
        jukeboxNew: { type: Boolean, default: true },
        rallyNew: { type: Boolean, default: true },
        chatMessage: { type: Boolean, default: true },
    },
    { _id: false }
);

const MobileRefreshTokenSchema = new Schema(
    {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

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
    deviceIdHash: {
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
    mobileRefreshTokens: {
        type: [MobileRefreshTokenSchema],
        default: [],
    },
    avatar: {
        type: String,
    },
    lastOnline: {
        type: Date,
    },
    deletedAt: {
        type: Date,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    announcementsSeen: {
        type: [String],
        default: [],
    },
    notificationLanguage: {
        type: String,
        enum: NOTIFICATION_LANGUAGES,
        default: DEFAULT_NOTIFICATION_LANGUAGE,
    },
    notificationStyle: {
        type: String,
        enum: NOTIFICATION_STYLES,
        default: DEFAULT_NOTIFICATION_STYLE,
    },
    notificationPrefs: {
        type: NotificationPrefsSchema,
        default: () => ({}),
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Strip auth secrets and verifiers from every client-facing serialization
// (NextResponse.json / JSON.stringify / .toJSON()). Server code reads these
// fields directly off the document, which this transform does not affect.
UserSchema.set("toJSON", {
    transform(_doc, ret) {
        delete ret.deviceId;
        delete ret.deviceIdHash;
        delete ret.connectToken;
        delete ret.connectTokenExpiresAt;
        delete ret.mobileRefreshTokens;
        delete ret.googleId;
        delete ret.fcmToken;
        return ret;
    },
});

// Mobile refresh and every authenticated mobile request look sessions up by
// hashed refresh token.
UserSchema.index({ "mobileRefreshTokens.tokenHash": 1 });

const User =
    (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
