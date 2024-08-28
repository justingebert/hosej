import mongoose from "mongoose";

export interface IPoints extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId;
  points: number;
  date: Date;
}

const PointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Create an index on the user field
PointsSchema.index({ user: 1 });

const Points = mongoose.models.Points || mongoose.model<IPoints>('Points', PointsSchema);

export default Points;
