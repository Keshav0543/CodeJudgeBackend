import cron from "node-cron";
import StatusUpdate from "../services/ContestStatus.js";
import calculateRatting from "../services/contestRank.js";

//For Saturday Contest jobs
cron.schedule(
  "16 0 * * 6",
  () => {
    StatusUpdate();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

cron.schedule(
  "16 0 * * 7",
  async () => {
    await StatusUpdate();
    await calculateRatting();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

//For Sunday Contest jobs
cron.schedule(
  "20 0 * * 7",
  () => {
    StatusUpdate();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

cron.schedule(
  "20 0 * * 1",
  async () => {
    await StatusUpdate();
    await calculateRatting();
  },
  {
    timezone: "Asia/Kolkata",
  },
);
