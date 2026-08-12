import Contest from "../models/contest.js";

const createContest= async(req,res) =>{
    try{
        const result=await Contest.create({
            ...req.body
        });
        res.status(201).json({
            contest_id: result._id,
            message:`${result.type} Created SuccessFfully...`
        });
    }
   catch (error) {
    res.status(404).json({
        message: error.message
    });
}
};

const getContest= async(req,res) =>{
    try{
        const data=await Contest.find({
            startTime:{$gt :new Date()}
        }).sort({startTime:1}).limit(2);

        if(data.length==0)throw new Error("Contest Data is not found...");
        res.status(200).json(data);
    }
    catch (error) {
    res.status(404).json({
        message: error.message
    });
}
};

const getSpecific =async(req,res) =>{
    try{
        const id=req.params.id;
        if(!id) throw new Error("ID is not present...");
        const info=await Contest.findById(id);
        if(!info)throw new Error("Select Valid Contest...");
        res.status(200).json(info);
    }
   catch (error) {
    res.status(404).json({
        message: error.message
    });
}
};

export default {createContest , getContest ,getSpecific};