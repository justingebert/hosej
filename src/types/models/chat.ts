import type { ToDTO } from "@/types/common";
import type { Types } from "mongoose";

export interface IMessage {
    user: Types.ObjectId | string;
    message: string;
    createdAt: Date;
}

enum EntityModel {
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

export type ChatDTO = ToDTO<IChat>;
