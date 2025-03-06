import { Types } from "mongoose";

export interface IRating extends Document {
    userId: Types.ObjectId;
    rating: number;
}

export interface ISong extends Document {
    spotifyTrackId: string;
    title: string;
    artist: string;
    album: string;
    coverImageUrl: string;
    submittedBy: Types.ObjectId;
    ratings: IRating[];
}

export interface IJukebox extends Document {
    groupId: Types.ObjectId;
    active: boolean;
    date: Date;
    songs: ISong[];
    chat: Types.ObjectId;
    createdAt: Date;
}
