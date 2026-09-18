import express from "express";
import adminMiddleware from "../middlewares/Adminmiddleware.js";
import userMiddleware from "../middlewares/usermiddleware.js";
import EditorialController from "../controllers/EditorialControl.js";
const EditorialRoutes=express.Router();

EditorialRoutes.post("/create/editorial",adminMiddleware,EditorialController.CreateEditorial);
EditorialRoutes.get("/fetch/editorial/:problemID", userMiddleware, EditorialController.FetchEditorial);
EditorialRoutes.patch("/update/editorial/:problemID", adminMiddleware, EditorialController.UpdateEditorial);
EditorialRoutes.delete("/delete/editorial/:problemID", adminMiddleware, EditorialController.deleteEditorial);

export default EditorialRoutes;
