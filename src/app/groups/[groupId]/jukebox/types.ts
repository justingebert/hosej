import { JukeboxDTO, RatingDTO, SongDTO } from "@/types/models/jukebox";
import { UserDTO } from "@/types/models/user";

export interface IProcessedRating extends Omit<RatingDTO, 'userId'> {
    userId: UserDTO;
}

export interface IProcessedSong extends Omit<SongDTO, 'ratings' | 'submittedBy'> {
    avgRating: number | null; // Calculated field
    userHasRated: boolean; // Whether the current user has rated this song
    submittedBy: UserDTO;
    ratings: IProcessedRating[];
}

export interface IJukeboxProcessed extends Omit<JukeboxDTO, 'songs'> {
    userHasSubmitted: boolean;
    songs: IProcessedSong[];
}
