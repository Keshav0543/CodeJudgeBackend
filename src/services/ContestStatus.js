import Contest from "../models/contest.js";

async function StatusUpdate() {
  try {
    const result = await Contest.find({
      status: { $in: ["Upcoming", "Live"] },
    });
    if (result.length == 0) throw new Error("No documents foundin db...");

    const currTime = new Date();
    for (let data of result) {
      if (currTime >= data.endTime) {
        data.status = "Expired";
        await data.save();
      } else if (currTime >= data.startTime) {
        data.status = "Live";
        await data.save();
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

export default StatusUpdate;