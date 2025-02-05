import { IJukebox, IRating, ISong } from "@/db/models/Jukebox";
import { IUser } from "@/db/models/user";

export interface IProcessedRating extends IRating{
    userId: IUser;
}

export interface IProcessedSong extends ISong {
    avgRating: number | null; // Calculated field
    userHasRated: boolean; // Whether the current user has rated this song
    submittedBy: IUser
    ratings: IProcessedRating[];
}
  
export interface IJukeboxProcessed extends IJukebox {
    userHasSubmitted: boolean;
    songs: IProcessedSong[];
}