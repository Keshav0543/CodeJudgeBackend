import jwt from "jsonwebtoken";
import User from "../models/user.js";
import client from "../config/redis.js";

const adminMiddleware=async (req,res,next)=>{
    try{

        const token=req.cookies.token;
        console.log(token);
        if(!token)throw new Error("Token is not valid...");

        const decode=jwt.verify(token,process.env.SECRET_KEY);
        const _id=decode._id;
        if(!_id)throw new Error("Invalid Token");

        const result=await User.findOne({emailId:decode.emailId});
        if(!result)throw new Error("User dosent exist...");
        
        if(decode.role!='admin')throw new Error("Permission Required...");
        
        //Redis me present toh nahi ha 
        const IsBlocked=await client.exists(`token:${token}`);
        if(IsBlocked)throw new Error("Invalid Token");
        req.result=result;

        next();
    }
    catch(err){
        res.status(400).send("Error: "+err.message);
    }
}

export default adminMiddleware;