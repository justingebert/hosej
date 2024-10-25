import mongoose, { Schema, Document } from "mongoose";
import { IGroup } from "./Group";

export interface IUser extends Document {
  _id: string;
  deviceId?: string; 
  fcmToken?: string;
  googleId?: string;
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
  googleId: {
    type: String,
    unique: true,
    sparse: true,
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
