import mongoose from "mongoose";
import { IGroup } from "./Group";

const PointsEntrySchema = new mongoose.Schema({
  points: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export interface IUser extends mongoose.Document {
  username: string;
  points: {
    points: number;
    date: Date;
  }[];
  streak: number;
  groups: IGroup[];
  createdAt: Date;
}

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  points: {
    type: [PointsEntrySchema],
    default: [{ points: 0, date: Date.now }],
  },
  streak: {
    type: Number,
    default: 0,
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.methods.addPoints = async function (points: number) {
  const today = new Date();
  const lastEntryDate =
    this.points.length > 0 ? this.points[this.points.length - 1].date : null;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Check if the last entry was yesterday
  if (
    lastEntryDate &&
    lastEntryDate.toDateString() === yesterday.toDateString()
  ) {
    this.streak += 1;
  } else if (
    lastEntryDate &&
    lastEntryDate.toDateString() === today.toDateString()
  ) {
    // Do nothing if there is already an entry for today
  } else {
    // Reset streak if last entry was not yesterday
    this.streak = 1;
  }

  // Add the new points entry
  const previousPoints = this.points.length > 0 ? this.points[this.points.length - 1].points : 0;
  const newPoints = points + previousPoints;
  this.points.push({ points: newPoints, date: today });

  // Save the updated user document
  await this.save();
};

const user = mongoose.models.user || mongoose.model<IUser>("user", UserSchema);

export default user;
