import { IJukebox, IRating, ISong } from "@/types/models/jukebox";
import { IUser } from "@/types/models/user";

export interface IProcessedRating extends IRating {
    userId: IUser;
}

export interface IProcessedSong extends ISong {
    avgRating: number | null; // Calculated field
    userHasRated: boolean; // Whether the current user has rated this song
    submittedBy: IUser;
    ratings: IProcessedRating[];
}

export interface IJukeboxProcessed extends IJukebox {
    userHasSubmitted: boolean;
    songs: IProcessedSong[];
}
