import mongoose, { Schema } from "mongoose";
import { IUser } from "@/types/models/user";

const UserSchema = new Schema({
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

    spotifyConnected: {
        type: Boolean,
        default: false,
    },
    spotifyUsername: {
        type: String,
        requried: false,
    },
    spotifyAccessToken: {
        type: String,
        requried: false,
    },
    spotifyRefreshToken: {
        type: String,
        requried: false,
    },
    spotifyTokenExpiresAt: {
        type: Number,
        requried: false,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
