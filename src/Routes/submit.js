import express from "express";
import userMiddleware from "../middlewares/usermiddleware.js";
import SubmitController from "../controllers/userSubmission.js";
import SubmitLimiter from "../middlewares/SubmitRateLimit.js";
import RunrateLimit from "../middlewares/RunrateLimit.js";
const SubmitRouter=express.Router();

SubmitRouter.post("/submit/:id", userMiddleware, SubmitLimiter, SubmitController.SubmitCode);
SubmitRouter.post("/run/:id", userMiddleware, RunrateLimit, SubmitController.RunCode);
SubmitRouter.get("/submission/:problemId", userMiddleware, SubmitController.getSubmissionDetail);

export default SubmitRouter;