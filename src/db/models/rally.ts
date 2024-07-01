import { create } from "domain";
import mongoose from "mongoose";

export interface IPictureSubmission {
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  imageUrl: string; 
  votes: [
    {
      username: String
    }
  ];
}

export interface IRally extends mongoose.Document {
  task: string;
  submissions: IPictureSubmission[];
  startTime: Date;
  endTime: Date;
  resultsShowing: boolean;
  votingOpen: boolean;
  used: boolean;
  active: boolean;
  lengthInDays: number;
  submittedBy: string;
}

const pictureSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String},
  imageUrl: { type: String, required: true },
  votes: [
    {
      username: { type: String, required: true},
    }
  ]
});

const rallySchema = new mongoose.Schema({
  task: { type: String, required: true },
  submissions: [pictureSubmissionSchema],
  startTime: { type: Date, required: false },
  endTime: { type: Date, required: false },
  resultsShowing: { type: Boolean, default: false },
  votingOpen: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  lengthInDays: { type: Number, required: true },
  submittedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Rally = mongoose.models.Rally || mongoose.model<IRally>("Rally", rallySchema);

export default Rally;
