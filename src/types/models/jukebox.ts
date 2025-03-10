import { Types, Document } from "mongoose";
import { AsJson } from "../common";

export interface IRating {
    userId: Types.ObjectId;
    rating: number;
}

export interface ISong {
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
export type IRatingJson = AsJson<IRating>;
export type ISongJson = AsJson<ISong>;
export type IJukeboxJson = AsJson<IJukebox>;
