import client from "../config/redis.js";
const TotalTTl=600;
const max_req=10;

const LoginLimit= async (req,res,next) =>{
    try{
        const key=`UserIP:${req.ip}`;
        const current_time=Date.now()/1000;
        const window_time=current_time-TotalTTl;

        await client.zAdd(key,[{score:current_time, value:`${current_time}:${Math.random()}`}]);

        await client.zRemRangeByScore(key,0,window_time);
        const Numberofreq= await client.zCard(key);

        if(Numberofreq>max_req)throw new Error("Cool Down, Try Again Later...");
        await client.expire(key,TotalTTl);

        next();
    }
    catch(err){
        res.status(401).send("Error: "+err.message);
    }
}

export default LoginLimit;