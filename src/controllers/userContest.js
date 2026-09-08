import Contest from "../models/contest.js";
import Contestparticipant from "../models/contestParticipant.js";
import getWeekendRange from "../utils/Rangefind.js";

const createContest = async (req, res) => {
  try {
    const { qualifier, type } = req.body;

    if (type === "sunday") {
      if (!qualifier) {
        throw new Error("Saturday qualifier contest is required...");
      }

      const saturdayContest = await Contest.findById(qualifier);

      if (!saturdayContest) {
        throw new Error("Reference Saturday contest does not exist...");
      }

      if (saturdayContest.type !== "saturday") {
        throw new Error("Reference Saturday ID is not valid...");
      }
    }

    const result = await Contest.create({
      ...req.body,
    });

    res.status(201).json({
      contest_id: result._id,
      message: `${result.type} Created Successfully...`,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getLatestContest = async (req, res) => {
  try {
    const { startOfSaturday, startOfMonday } = getWeekendRange();
    const currTime = new Date();

    const result = await Contest.find({
      startTime: { $gte: startOfSaturday, $lt: startOfMonday },
    });

    const saturdayContest = result.find((c) => c.type === "saturday");
    const sundayContest = result.find((c) => c.type === "sunday");

    const getStatus = (contest) => {
      if (!contest) return { status: "Not Available", delay: 0 };

      const startDiff = contest.startTime.getTime() - currTime.getTime();
      const endDiff = contest.endTime.getTime() - currTime.getTime();

      if (startDiff > 0) return { status: "Upcoming", delay: startDiff };
      if (endDiff > 0) return { status: "Live", delay: endDiff };
      return { status: "Expired", delay: 0 };
    };

    const sat = getStatus(saturdayContest);
    const sun = getStatus(sundayContest);

    res.status(200).json({
      saturdayContest: {
        contest: saturdayContest || null,
        status: sat.status,
        delay: sat.delay,
      },
      sundayContest: {
        contest: sundayContest || null,
        status: sun.status,
        delay: sun.delay,
      },
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Select the contest to delete..."
      });
    }

    let result = await Contest.findOne({_id:id,type:"saturday"});
    let sundayResult;
    if(result!==null)sundayResult=await Contest.findOne({ qualifier: id });
    else if(!result)sundayResult=await Contest.findById(id);

    if(!result && sundayResult!==null)result=await Contest.findOne({_id:sundayResult.qualifier});

    if (!result && !sundayResult) {
      return res.status(404).json({
        message: "Selected Contest is not there..."
      });
    }

    // Don't allow deletion if either contest is Live
    if (
      result.status === "Live" ||
      (sundayResult && sundayResult.status === "Live")
    ) {
      return res.status(403).json({
        message: "Access is denied to delete a Live event..."
      });
    }

    // Delete Saturday contest
    await Contest.deleteOne({ _id: result._id });

    // If there is no dependent Sunday contest
    if (!sundayResult) {
      return res.status(200).json({
        message: "Saturday Contest deleted successfully..."
      });
    }

    // Delete dependent Sunday contest
    await Contest.deleteOne({ _id: sundayResult._id });

    return res.status(200).json({
      message: "Both Battles deleted successfully..."
    });

  } catch (error) {
    console.error("deleteContest error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

const getSpecific = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("ID is not present...");
    const info = await Contest.findById(id);
    if (!info) throw new Error("Select Valid Contest...");

    const serverTime = new Date();
    const startDiff = info.startTime.getTime() - serverTime;
    const endDiff = info.endTime.getTime() - serverTime;
    const isRegistered = await Contestparticipant.exists({
      contest_id: id,
      user_id: req.result._id,
    });

    let status, delay;

    if (startDiff > 0) {
      status = "Upcoming";
      delay = startDiff; // itne ms baad contest live hoga
    } else if (startDiff <= 0 && endDiff > 0) {
      status = "Live";
      delay = endDiff; // itne ms baad contest end hoga
    } else {
      status = "Expired";
      delay = null; // ab wait karne ko kuch nahi
    }

    info.status = status;
    await info.save();
    res.status(200).json({
      contest: info,
      status,
      delay,
      serverTime, // frontend ka clock drift adjust karne ke liye
      isRegistered: !!isRegistered,
    });
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};

const contestRegister = async (req, res) => {
  try {
    const { contest_id } = req.body;
    const user_id = req.result._id;

    if (!contest_id) throw new Error("Select Contest Before begin...");

    if (!user_id) throw new Error("Logged in first to continue....");

    const iscontestvalid = await Contest.findById(contest_id);

    if (!iscontestvalid) throw new Error("Selected Contest is not present...");

    const isavailable = await Contestparticipant.exists({
      contest_id,
      user_id,
    });

    if (isavailable) throw new Error("Already registered for this contest...");

    // Saturday Contest
    if (iscontestvalid.type === "saturday") {
      const result = await Contestparticipant.create({
        contest_id,
        user_id,
      });

      return res.status(201).json({
        message: "Successfully registered for Saturday contest...",
        participant: result,
      });
    }

    // Sunday Contest
    else if (iscontestvalid.type === "sunday") {
      // Sunday must have a qualifier contest
      if (!iscontestvalid.qualifier)
        throw new Error(
          "You are not eligible for this contest, try to join Saturday contest first...",
        );

      // Find user's participation in the qualifying Saturday contest
      const saturdayParticipant = await Contestparticipant.findOne({
        contest_id: iscontestvalid.qualifier,
        user_id,
      });

      // User didn't participate in the qualifying Saturday
      if (!saturdayParticipant)
        throw new Error(
          "You did not participate in the qualifying Saturday contest...",
        );

      // User participated but was not admitted
      if (!saturdayParticipant.admittedFromContest)
        throw new Error("You are not eligible for Sunday Contest...");

      // Make sure admission came from THIS qualifier contest
      if (
        saturdayParticipant.admittedFromContest.toString() !==
        iscontestvalid.qualifier.toString()
      ) {
        throw new Error("You are not eligible for this Sunday Contest...");
      }

      // Register user for Sunday
      const participant = await Contestparticipant.create({
        contest_id,
        user_id,
      });

      return res.status(201).json({
        message: "Successfully registered for Sunday contest...",
        participant,
      });
    }

    throw new Error("Invalid contest type...");
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const startContest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error("Contest Id is not available...");
    const user_id = req.result._id;
    const isregister = await Contestparticipant.findOne({
      contest_id: id,
      user_id,
    });
    if (!isregister)
      throw new Error("You Are Not Register For This contest...");
    if(isregister.resultsCalculated)throw new Error("You are allready Submitted Contest...");
    const contestInfo =
      await Contest.findById(id).populate("problem.problemId");
    if (!contestInfo)
      throw new Error("contestId is wrong try again with ActualId...");
    const currTime = new Date();
    if (currTime < contestInfo.startTime)
      throw new Error("Contest has not started yet...");
    if (currTime > contestInfo.endTime)
      throw new Error("This Contest is Not available...");
    // if (!isregister.startedAt) {
    //   isregister.startedAt = currTime;
    //   isregister.status = "started";
    // }
    const problemInfo = contestInfo.problem;
    // await isregister.save();
    const usertime = currTime.getTime() + 90 * 60 * 1000;
    res.status(200).json({
      ProblemInfo: problemInfo,
      startTimer: isregister.startedAt,
      FinishcontestTime:
        usertime < contestInfo.endTime ? usertime : contestInfo.endTime,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getSaturdayContests = async (req, res) => {
  try {
    const latestSaturdayContest = await Contest.findOne({ type: "saturday" })
      .sort({ createdAt: -1 })
      .select("_id title startTime");

    if (!latestSaturdayContest) {
      return res.status(404).json({ message: "No Saturday contest found" });
    }
    console.log(latestSaturdayContest);
    res.status(200).json(latestSaturdayContest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const FetchAllContest = async (req,res) =>{
  try{
     console.log("controler working...");
    let {page,limit}=req.query;
    let skip=(Number(page)-1)*Number(limit);
    const contestHistory=await Contest.find({}).sort({createdAt:-1}).skip(skip).limit(Number(limit));
    if(contestHistory.length==0)return res.status(200).json({
      contestData:[]
    });
    res.status(200).json({
      contestData:contestHistory
    });
  }
  catch(error){
    res.status(400).json({
      message:error.message
    });
  }
};

export default {
  createContest,
  getLatestContest,
  getSpecific,
  contestRegister,
  startContest,
  deleteContest,
  getSaturdayContests,
  FetchAllContest
};