import { Document, Types } from "mongoose";
import { AsJson } from "../common";

export interface IMessage {
    user: Types.ObjectId; 
    message: string;
    createdAt: Date;
}

enum EntityModel {
    Question = "Question",
    Rally = "Rally",
    Jukebox = "Jukebox",
}

export interface IChat extends Document {
    group: Types.ObjectId;
    messages: IMessage[];
    entity: Types.ObjectId;
    entityModel: EntityModel;
    createdAt: Date;
}

export type IChatJson = AsJson<IChat>;