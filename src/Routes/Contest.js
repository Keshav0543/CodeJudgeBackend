import express from "express";
import adminMiddleware from "../middlewares/Adminmiddleware.js";
import userMiddleware from "../middlewares/usermiddleware.js";
import contestController from "../controllers/userContest.js";
const ContestRouter=express.Router();

ContestRouter.post("/contest/create", adminMiddleware, contestController.createContest);
ContestRouter.get("/contest", userMiddleware, contestController.getContest);
ContestRouter.get("/contest/:id", userMiddleware, contestController.getSpecific);


export default ContestRouter;