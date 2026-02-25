import { z } from "zod";

export const AddSongSchema = z.object({
    spotifyTrackId: z.string().min(1, "spotifyTrackId is required"),
    title: z.string().min(1, "title is required").max(300),
    artist: z.string().min(1, "artist is required").max(300),
    album: z.string().max(300).optional(),
    coverImageUrl: z.string().optional(),
});

export const RateSongSchema = z.object({
    rating: z.number().int().min(1).max(100),
});
