import { Document, Types } from "mongoose";
import { AsJson } from "../common";

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

export type IUserJson = AsJson<IUser>; 