import { IJukeboxJson, IRating, IRatingJson, ISong, ISongJson } from "@/types/models/jukebox";
import { IUserJson } from "@/types/models/user";

export interface IProcessedRating extends Omit<IRatingJson, 'userId'> {
    userId: IUserJson;
}

export interface IProcessedSong extends Omit<ISongJson, 'ratings' | 'submittedBy'> {
    avgRating: number | null; // Calculated field
    userHasRated: boolean; // Whether the current user has rated this song
    submittedBy: IUserJson;
    ratings: IProcessedRating[];
}

export interface IJukeboxProcessed extends Omit<IJukeboxJson, 'songs'> {
    userHasSubmitted: boolean;
    songs: IProcessedSong[];
}
