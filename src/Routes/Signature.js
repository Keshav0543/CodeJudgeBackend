import express from "express";
import adminMiddleware from "../middlewares/Adminmiddleware.js"
import SignatureController from "../controllers/cloudinarycontroller.js";
const signatureRouter=express.Router();

signatureRouter.get("/signature/cloudinary",adminMiddleware,SignatureController.GenerateUploadSignature);
export default signatureRouter;