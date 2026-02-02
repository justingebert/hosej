import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "@/types/common";

export interface IMessage {
    user: Types.ObjectId | string;
    message: string;
    createdAt: Date;
}

export enum EntityModel {
    Question = "Question",
    Rally = "Rally",
    Jukebox = "Jukebox",
}

export interface IChat {
    _id: Types.ObjectId;
    group: Types.ObjectId;
    messages: IMessage[];
    entity: Types.ObjectId;
    entityModel: EntityModel;
    createdAt: Date;
}

export type ChatDocument = HydratedDocument<IChat>;

export type ChatDTO = ToDTO<IChat>;
