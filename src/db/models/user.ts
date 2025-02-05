import mongoose, { Schema, Document } from "mongoose";
import { IGroup } from "./Group";
import Spotify from "next-auth/providers/spotify";

export interface IUser extends Document {
  _id: string;
  deviceId?: string; 
  fcmToken?: string;
  googleConnected: boolean;
  googleId?: string;
  spotifyConnected: boolean;
  spotifyUsername?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiresAt?: number;
  email?: string;
  username: string;
  groups: IGroup[];
  createdAt: Date;
}

const UserSchema = new Schema({
  deviceId: {
    type: String,
    unique: true,
    sparse: true,
  },
  fcmToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  googleConnected: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  spotifyConnected:{
    type: Boolean,
    default: false
  },  
  spotifyUsername: {
    type: String,
    requried: false
  },
  spotifyAccessToken: {
    type:String,
    requried: false
  },
  spotifyRefreshToken: {
    type: String,
    requried: false
  },
  spotifyTokenExpiresAt: {
    type: Number,
    requried: false
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    required: true,
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
