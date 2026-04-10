import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "../common";

export interface IUser {
    _id: Types.ObjectId;
    username: string;
    groups: (Types.ObjectId | string)[];

    deviceId?: string;
    fcmToken?: string;
    googleConnected: boolean;
    googleId?: string;
    connectToken?: string;
    connectTokenExpiresAt?: Date;

    avatar?: string;
    lastOnline?: Date;

    createdAt: Date;
}
export type UserDocument = HydratedDocument<IUser>;

export type UserDTO = ToDTO<IUser> & {
    avatarUrl?: string;
};

/** Fields that can be updated via PUT /users */
export interface UpdateUserData {
    username?: string;
    avatar?: string | null;
}
