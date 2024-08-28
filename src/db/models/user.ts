import mongoose, { Schema, Document, Model } from "mongoose";
import { IGroup } from "./Group";
import PointsEntry from "./Points";

export interface IUser extends Document {
  _id: string;
  deviceId?: string;
  googleId?: string;
  email?: string;
  username: string;
  totalPoints: number;
  streak: number;
  groups: IGroup[];
  createdAt: Date;
  addPoints(points: number): Promise<void>;
  getTotalPoints(): Promise<number>;
}

const UserSchema = new Schema({
  deviceId: {
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
  totalPoints: {
    type: Number,
    default: 0,
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

// Method to add points to a user
UserSchema.methods.addPoints = async function (points: number) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Fetch the last points entry
  const lastEntry = await PointsEntry.findOne({ user: this._id })
    .sort({ date: -1 })
    .exec();

  // Update streak based on last entry's date
  if (lastEntry && lastEntry.date.toDateString() === yesterday.toDateString()) {
    this.streak += 1;
  } else if (lastEntry && lastEntry.date.toDateString() === today.toDateString()) {
    // Do nothing if there is already an entry for today
  } else {
    // Reset streak if last entry was not yesterday
    this.streak = 1;
  }

  // Create and save the new points entry
  const newPointsEntry = new PointsEntry({
    user: this._id,
    points: points + (lastEntry ? lastEntry.points : 0),
  });

  await newPointsEntry.save();

  // Update the user's total points and save
  this.totalPoints += points;
  await this.save();
};

// Method to calculate the total points for a user
UserSchema.methods.getTotalPoints = async function () {
  const total = await PointsEntry.aggregate([
    { $match: { user: this._id } },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);

  return total[0] ? total[0].total : 0;
};

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
