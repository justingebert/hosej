import { Document, Types } from "mongoose";

export interface IMessage{
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
    entity: string | Types.ObjectId;
    entityModel: EntityModel;
    createdAt: Date;
}

