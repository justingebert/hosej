import { Types } from "mongoose";
import { ToDTO } from "../common";

export interface IRating {
    userId: Types.ObjectId | string;
    rating: number;
}

export interface ISong {
    spotifyTrackId: string;
    title: string;
    artist: string;
    album: string;
    coverImageUrl: string;
    submittedBy: Types.ObjectId | string;
    ratings: IRating[];
}

export interface IJukebox {
    _id: Types.ObjectId
    groupId: Types.ObjectId;
    active: boolean;
    date: Date;
    songs: ISong[];
    chat: Types.ObjectId;
    createdAt: Date;
}

export type RatingDTO = ToDTO<IRating>;
export type SongDTO = ToDTO<ISong>;
export type JukeboxDTO = ToDTO<IJukebox>;
