import { Document, Types } from "mongoose";

export interface IUser extends Document {
    username: string;
    groups: Types.ObjectId[];

    deviceId?: string;
    fcmToken?: string;
    googleConnected: boolean;
    googleId?: string;

    spotifyConnected: boolean;
    spotifyUsername?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyTokenExpiresAt?: number;

    createdAt: Date;
}
