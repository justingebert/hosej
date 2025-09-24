import { Types } from "mongoose";
import { ToDTO } from "../common";

export interface IUser {
    _id: Types.ObjectId;
    email: string;
    image?: string;
    username: string;
    groups: (Types.ObjectId | string) [];

    deviceId?: string;
    fcmToken?: string;
    googleConnected: boolean;
    googleId?: string;

    createdAt: Date;
}

export type UserDTO = ToDTO<IUser>;