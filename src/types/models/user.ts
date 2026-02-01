import type { Types } from "mongoose";
import type { ToDTO } from "../common";

export interface IUser {
    _id: Types.ObjectId;
    email: string;
    image?: string;
    username: string;
    groups: (Types.ObjectId | string)[];

    deviceId?: string;
    fcmToken?: string;
    googleConnected: boolean;
    googleId?: string;

    createdAt: Date;
}

export type UserDTO = ToDTO<IUser>;
