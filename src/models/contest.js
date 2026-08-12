import mongoose from "mongoose";

const { Schema } = mongoose;

const contestSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["saturday", "sunday"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  problem: [
    {
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "problem", 
        required: true,
      },
      points: {
        type: Number,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Upcoming", "Live", "Ended"],
    default: "Upcoming",
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
    validate:{
      validator:function (value){
        return value>this.startTime;
      },
      message:"End time must be greater than start time"
    }
  },
  qualifierContest: {
    type: Schema.Types.ObjectId,
    ref: "contest", 
    default: null,
  },
  rules: [String],
},{timestamps:true});

contestSchema.index({
  startTime:1
});

const Contest = mongoose.model("contest", contestSchema);

export default Contest;