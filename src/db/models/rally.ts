import mongoose from "mongoose";

interface IPictureSubmission {
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  imageUrl: string; 
  votes: [
    {
      username: mongoose.Schema.Types.ObjectId;
      response: mongoose.Schema.Types.Mixed;
    }
  ];
}

export interface IRally extends mongoose.Document {
  task: string;
  submissions: IPictureSubmission[];
  startTime: Date;
  endTime: Date;
  resultsShown: boolean;
  votingOpen: boolean;
  used: boolean;
  active: boolean;
}

const pictureSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String},
  imageUrl: { type: String, required: true },
  votes: [
    {
      username: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
      response: { type: mongoose.Schema.Types.Mixed, required: true},
    }
  ]
});

const rallySchema = new mongoose.Schema({
  task: { type: String, required: true },
  submissions: [pictureSubmissionSchema],
  startTime: { type: Date, default: Date.now, required: true },
  endTime: { type: Date, required: true },
  resultsShowning: { type: Boolean, default: false },
  votingOpen: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
});

const Rally = mongoose.models.Rally || mongoose.model<IRally>("Rally", rallySchema);

export default Rally;
