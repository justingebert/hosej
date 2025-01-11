import mongoose from "mongoose";


export interface IRating extends mongoose.Document {
    userId: string,
    rating: number,
}

export interface ISong extends mongoose.Document {
    spotifyTrackId: string,
    title: string,
    artist: string,
    album: string,
    coverImageUrl: string,
    submittedBy: string,
    ratings: IRating[],
}

export interface IJukebox extends mongoose.Document {
    groupId: string,
    active: boolean,
    date: Date,
    songs: ISong[],
    createdAt: Date,
}

const RatingSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
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
      ref: 'User',
      required: true,
    },
    ratings: [RatingSchema],
  });

const jukeBoxSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    active: { type: Boolean, default: false },
    date: { type: Date, required: true },
    songs: [SongSchema],
    createdAt: { type: Date, default: Date.now },
});

const Jukebox = mongoose.models.Jukebox || mongoose.model<IJukebox>("Jukebox", jukeBoxSchema);

export default Jukebox;