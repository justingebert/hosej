import { Types } from "mongoose";
import { ToDTO } from "../common";
import { UserDTO } from "./user";

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
    groupId: Types.ObjectId | string;
    title?: string,
    active: boolean;
    date: Date;
    songs: ISong[];
    chat: Types.ObjectId;
    createdAt: Date;
}

export type RatingDTO = ToDTO<IRating>;
export type SongDTO = ToDTO<ISong>;
export type JukeboxDTO = ToDTO<IJukebox>;


export interface IProcessedRatingDTO {
    userId: UserDTO;
    rating: number;
}

export interface IProcessedSongDTO extends Omit<SongDTO, "submittedBy" | "ratings"> {
    submittedBy: UserDTO;
    ratings: IProcessedRatingDTO[];
    avgRating: number | null;
    userHasRated: boolean;
}

export interface IJukeboxProcessedDTO extends Omit<JukeboxDTO, "songs"> {
    userHasSubmitted: boolean;
    songs: IProcessedSongDTO[];
}

export type IProcessedSong = IProcessedSongDTO;
export type IJukeboxProcessed = IJukeboxProcessedDTO;
