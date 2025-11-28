import mongoose from "mongoose";
import { IJukebox, IRating, ISong } from "@/types/models/jukebox";

const RatingSchema = new mongoose.Schema<IRating>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
    },
});

const SongSchema = new mongoose.Schema<ISong>({
    spotifyTrackId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
    album: {
        type: String,
    },
    coverImageUrl: {
        type: String,
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ratings: [RatingSchema],
});

const jukeboxSchema = new mongoose.Schema<IJukebox>({
    groupId: {type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true},
    title: {type: String},
    active: {type: Boolean, default: false},
    date: {type: Date, required: true},
    songs: [SongSchema],
    chat: {type: mongoose.Schema.Types.ObjectId, ref: "Chat"},
    createdAt: {type: Date, default: Date.now},
});

const Jukebox = mongoose.models.Jukebox as mongoose.Model<IJukebox> || mongoose.model<IJukebox>("Jukebox", jukeboxSchema);

export default Jukebox;
