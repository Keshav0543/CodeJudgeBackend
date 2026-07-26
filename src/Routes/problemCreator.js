import express from "express";
import adminMiddleware from "../middlewares/Adminmiddleware.js";
import userMiddleware from "../middlewares/usermiddleware.js";
import ProblemController from "../controllers/userProblem.js";
const problemRouter=express.Router();




problemRouter.post('/create',adminMiddleware,ProblemController.NewProblem);
problemRouter.put('/update/:id',adminMiddleware,ProblemController.UpdateProblem);
problemRouter.delete('/Delete/:id',adminMiddleware,ProblemController.DeleteProblem);

problemRouter.get('/ProblemById/:id',userMiddleware,ProblemController.FetchProblem);
problemRouter.get('/GetAllProblem',userMiddleware,ProblemController.getAllProblem);
problemRouter.get('/ProblemSolvedByUser',userMiddleware,ProblemController.SolvedProblem);
problemRouter.get('/search',userMiddleware,ProblemController.searchProblem);

export default problemRouter;