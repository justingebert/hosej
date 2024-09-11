import mongoose, { Schema, Document } from "mongoose";
import { IGroup } from "./Group";

export interface IUser extends Document {
  _id: string;
  deviceId?: string; 
  fcmToken?: string;
  googleId?: string;
  email?: string;
  username: string;
  groups: {group: IGroup[], points: number, streak:number, lastPointsDate: Date}[];
  createdAt: Date;
  addPoints(groupId:string, points: number): Promise<void>;
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
      group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
      },
      points: {
        type: Number,
        default: 0,
      },
      streak:{
        type: Number,
        default: 0,
      },
      lastPointDate: {
        type: Date,
        default: null,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


UserSchema.methods.addPoints = async function (groupId: string, points: number) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groupPointsEntry = this.groups.find(
    (group: any) => group.group.toString() === groupId
  );

  if (groupPointsEntry) {
    groupPointsEntry.points += points;

    if (groupPointsEntry.lastPointDate && groupPointsEntry.lastPointDate.toDateString() === yesterday.toDateString()) {
      groupPointsEntry.streak += 1;
    } else if (groupPointsEntry.lastPointDate && groupPointsEntry.lastPointDate.toDateString() === today.toDateString()) {
      
    } else {
      groupPointsEntry.streak = 1;
    }

    groupPointsEntry.lastPointDate = today;
  }

  await this.save();
};

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
