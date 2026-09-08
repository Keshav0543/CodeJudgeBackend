import express from "express";
import adminMiddleware from "../middlewares/Adminmiddleware.js";
import userMiddleware from "../middlewares/usermiddleware.js";
import contestController from "../controllers/userContest.js";
import SubmitController from "../controllers/userSubmission.js";
const ContestRouter = express.Router();

ContestRouter.post(
  "/contest/create",
  adminMiddleware,
  contestController.createContest,
);

ContestRouter.get(
  "/contest/history",
  adminMiddleware,
  contestController.FetchAllContest,
);

ContestRouter.get(
  "/contest/saturday-latest",
  adminMiddleware,
  contestController.getSaturdayContests,
);

ContestRouter.get(
  "/contest",
  userMiddleware,
  contestController.getLatestContest,
);
ContestRouter.get(
  "/contest/:id",
  userMiddleware,
  contestController.getSpecific,
);
ContestRouter.post(
  "/contest/register",
  userMiddleware,
  contestController.contestRegister,
);
ContestRouter.get(
  "/contest/:id/arena",
  userMiddleware,
  contestController.startContest,
);
ContestRouter.get(
  "/contest/:contest_id/leaderboard",
  userMiddleware,
  SubmitController.getcontestSubmissionDetail,
);
ContestRouter.delete(
  "/contest/:id",
  adminMiddleware,
  contestController.deleteContest,
);


export default ContestRouter;
