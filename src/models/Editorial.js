import mongoose from "mongoose";

const { Schema } = mongoose;

const EditorialSchema = new Schema({
  Problem_id: {
    type: mongoose.Schema.ObjectId,
    ref: "Problem",
    required: true,
    unique:true
  },

  User_id: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

 languages:[
    {
        language:{
        type:String,
        enum:["java","cpp","javascript"],
        },
        code:String,
    }
 ],

  media: [
    {
      type: {
        type: String,
        enum: ["video", "image"],
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
  ],

  sections: [
    {
      heading: String,
      content: String,
    },
  ],
},{timestamps:true});

const EditorialS=mongoose.model("EditorialS",EditorialSchema);

export default EditorialS;