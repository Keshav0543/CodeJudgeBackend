import mongoose from "mongoose";
const { Schema } = mongoose;

const submissionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  problemId: {
    type: Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },

  code: {
    type: String,
    required: true,
  },

  language: {
    type: String,
    required: true,
    enum: ["C","C++","Java","JavaScript","Python","C#","Go","PHP"]
  },

  status:{
    type:String,
    required:true,
  },

  runtime:{
    type:Number,
    default:0
  },

  memory:{
    type:Number,
    default:0
  },

  errorMessage:{
    type:String,
    default:""
  },

  testCasesPassed:{
    type:Number,
    default:0
  },

  totalTestCases:{
    type:Number,
    default:0
  }
},{timestamps:true});

submissionSchema.index({userId:1, problemId:1});

const SubmissionS= mongoose.model("submissionS",submissionSchema);

export default SubmissionS;