import mongoose from "mongoose";
export interface IPoints extends Document {
  user: string;
  points: number;
  date: Date;
}

// Define the PointsEntry schema
const PointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// Create a compound index on user and date to optimize query performance
PointsSchema.index({ user: 1, date: -1 });

// Create and export the PointsEntry model
const PointsEntry = mongoose.models.Points || mongoose.model<IPoints>("Points", PointsSchema);


export default PointsEntry;
