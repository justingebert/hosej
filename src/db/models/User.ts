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
        questionUnanswered: { type: Boolean, default: true },
        rallySubmitDeadline: { type: Boolean, default: true },
        rallyVoteDeadline: { type: Boolean, default: true },
        rallyFirstSubmission: { type: Boolean, default: true },
        jukeboxSubmit: { type: Boolean, default: true },
        jukeboxRate: { type: Boolean, default: true },
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

const User =
    (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
