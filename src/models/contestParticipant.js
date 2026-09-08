import mongoose from "mongoose";

const { Schema } = mongoose;

const contestParticipant = new Schema({
  contest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "contest",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  ratingChange: {
    type: Number,
    default: null,
  },
  ratingBefore: {
    type: Number,
    default: null,
  },
  ratingAfter: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    default: "registered",
    enum: ["registered", "started", "finished"],
  },
  finishedAt: {
    type: Date,
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  resultsCalculated: {
    type: Boolean,
    default: false,
  },
  admittedFromContest: {
    type: mongoose.Schema.ObjectId,
    ref: "contest",
    default: null,
  },
});

contestParticipant.index({ contest_id: 1, user_id: 1 }, { unique: true });

const Contestparticipant = mongoose.model(
  "contestparticipant",
  contestParticipant,
);
export default Contestparticipant;
