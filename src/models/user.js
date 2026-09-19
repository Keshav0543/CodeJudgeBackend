import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },

    lastName: {
      type: String,
      minLength: 3,
      maxLength: 20,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },

    age: {
      type: Number,
      min: 5,
      max: 80,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    ProblemSolved: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Problem",
        },
      ],
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      default: 1500,
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    lastActiveDate: {
      type: Date,
      default: null,
    },

    githubProfile: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchema);

export default User;
