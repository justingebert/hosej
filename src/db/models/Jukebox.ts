import mongoose from "mongoose";
import { IJukebox } from "@/types/models/jukebox";

const RatingSchema = new mongoose.Schema({
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

const SongSchema = new mongoose.Schema({
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

const jukeBoxSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    active: { type: Boolean, default: false },
    date: { type: Date, required: true },
    songs: [SongSchema],
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    createdAt: { type: Date, default: Date.now },
});

const Jukebox = mongoose.models.Jukebox || mongoose.model<IJukebox>("Jukebox", jukeBoxSchema);

export default Jukebox;
