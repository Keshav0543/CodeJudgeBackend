import express from "express";
import authController from "../controllers/userAuthent.js"
import userMiddleware from "../middlewares/usermiddleware.js";
import adminMiddleware from "../middlewares/Adminmiddleware.js";
import RegisterLimit from "../middlewares/RegisterRateLimit.js";
import LoginLimit from "../middlewares/LoginLimit.js";
//User Register

export default express.Router()
.post('/register',RegisterLimit,authController.register)
.post('/login',LoginLimit,authController.login)
.post('/logout',userMiddleware,authController.logout)
.get('/getProfile',userMiddleware,authController.getProfile)
.post("/admin/register",adminMiddleware,authController.admin)
.delete("/profile",userMiddleware,authController.deleteProfile)
.get("/authenticate",userMiddleware,authController.authenticate);

