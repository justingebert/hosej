import mongoose from "mongoose";

export interface IRally extends mongoose.Document {
  _id: string | mongoose.Schema.Types.ObjectId;
  groupId: mongoose.Schema.Types.ObjectId;
  task: string;
  submissions: IPictureSubmission[];
  startTime: Date;
  endTime: Date;
  votingOpen: boolean;
  resultsShowing: boolean;
  used: boolean;
  active: boolean;
  lengthInDays: number;
  submittedBy: string;
}

export interface IPictureSubmission {
  _id: string | mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  imageUrl: string; 
  votes: [
    {
      user: mongoose.Schema.Types.ObjectId
      time: Date
    },
  ];
}

const pictureSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String},
  imageUrl: { type: String, required: true },
  votes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      time: { type: Date},
    }
  ]
});

const rallySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  task: { type: String, required: true },
  submissions: [pictureSubmissionSchema],
  startTime: { type: Date, required: false },
  endTime: { type: Date, required: false },
  votingOpen: { type: Boolean, default: false },
  resultsShowing: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  lengthInDays: { type: Number, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  createdAt: { type: Date, default: Date.now },
});

rallySchema.index({ groupId: 1 })

const Rally = mongoose.models.Rally || mongoose.model<IRally>("Rally", rallySchema);

export default Rally;
