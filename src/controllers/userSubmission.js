import problem from "../models/problem.js";
import SubmissionS from "../models/Submission.js";
import Contest from "../models/contest.js";
import Contestparticipant from "../models/contestParticipant.js";
import mongoose from "mongoose";
import {
  getlanguageId,
  submitBatch,
  submitToken,
} from "../utils/Problemutility.js";

const SubmitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    const { code, language, contest_id } = req.body;
    if (!userId || !problemId || !code || !language)
      return res.status(400).send("Field is Missing...");

    let contestcheck, ParticipantCheck;
    if (contest_id) {
      contestcheck = await Contest.findById(contest_id);

      if (!contestcheck) throw new Error("Selected Contest is not valid...");

      ParticipantCheck = await Contestparticipant.findOne({
        contest_id,
        user_id: req.result._id,
      });

      if (!ParticipantCheck)
        throw new Error("User is not registered in Contest...");

      if (ParticipantCheck.status !== "started")
        throw new Error("Contest is not started...");

      // Check whether this problem belongs to this contest
      const isPresent = contestcheck.problem.some(
        (data) => data.problemId.toString() === problemId.toString(),
      );

      if (!isPresent)
        throw new Error("Problem is not present in this contest...");

      const currentTime = new Date();

      const userDeadline = new Date(
        ParticipantCheck.startedAt.getTime() + 90 * 60 * 1000,
      );

      // Actual deadline = whichever comes first
      const finalDeadline =
        userDeadline < contestcheck.endTime
          ? userDeadline
          : contestcheck.endTime;

      // Small grace period for network/request delay
      const gracePeriod = 5 * 1000;

      const allowedUntil = new Date(finalDeadline.getTime() + gracePeriod);

      if (currentTime > allowedUntil)
        throw new Error("Contest submission time has expired...");
    }

    //Fetch The Problem
    const Problem = await problem.findById(problemId);
    if (!Problem) throw new Error("Problem not found...");
    //Now we have test cases from above

    const SubmittedResult = await SubmissionS.create({
      userId,
      problemId,
      code,
      language,
      testCasesPassed: 0,
      totalTestCases: Problem.invisibleTestcases.length,
      status: "pending",
    });

    //Judge0 Submission
    const LangId = getlanguageId(language);
    const submission = [];
    const driver = Problem.driverCode.find(
      (data) => data.language.toLowerCase() === language.toLowerCase(),
    );
    if (!driver) throw new Error(`No driver code for language "${language}"`);
    for (const data of Problem.invisibleTestcases) {
      submission.push({
        source_code: code + driver.code,
        language_id: LangId,
        stdin: data.input,
        expected_output: data.output,
      });
    }

    const submitResult = await submitBatch(submission);
    const resultToken = submitResult.map((value) => value.token);
    const FinalResult = await submitToken(resultToken);

    //Submitted Result Update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "Accepted";
    let errorMessage = null;

    for (const result of FinalResult) {
      if (result.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(result.time) * 1000;
        memory = Math.max(result.memory, memory);
        continue;
      }

      // pehli baar hi fail hua toh status set karo (varna baad ke passed cases se overwrite ho sakta hai agar tu loop ke bahar bhi kuch check karta hai)
      switch (result.status_id) {
        case 4:
          status = "wrong_answer";
          errorMessage =
            result.stderr || "Output did not match expected output";
          break;

        case 5:
          status = "tle";
          errorMessage = "Time Limit Exceeded";
          break;

        case 6:
          status = "compilation_error";
          errorMessage = result.compile_output || "Compilation failed";
          break;

        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
          status = "runtime_error";
          errorMessage =
            result.stderr ||
            `Runtime Error (${result.status.description || "unknown signal"})`;
          break;

        case 13:
          status = "internal_error";
          errorMessage = "Judge0 internal error, try again";
          break;

        case 14:
          status = "exec_format_error";
          errorMessage = "Executable format error";
          break;

        default:
          status = "unknown";
          errorMessage = result.stderr || "Unknown error occurred";
      }

      // pehla fail milte hi loop se bahar niklo (competitive judges aise hi karte hain)
      break;
    }
    //Store the result in Database
    SubmittedResult.status = status;
    SubmittedResult.testCasesPassed = testCasesPassed;
    SubmittedResult.runtime = runtime;
    SubmittedResult.memory = memory;
    SubmittedResult.errorMessage = errorMessage;

    if (contestcheck) SubmittedResult.contestId = contest_id;

    await SubmittedResult.save();

    //Problem Id insert in User Schema problem section if it is not present
    if (
      SubmittedResult.status === "Accepted" &&
      !req.result.ProblemSolved.includes(problemId)
    ) {
      req.result.ProblemSolved.push(problemId);
      await req.result.save();
    }
    res.status(200).json(SubmittedResult);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const RunCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const id = req.params.id;
    if (!id) throw new Error("Required Missing Field...");

    const Problem = await problem.findById(id);
    const driver = Problem.driverCode.find(
      (data) => data.language.toLowerCase() === language.toLowerCase(),
    );
    if (!driver) throw new Error(`No driver code for language "${language}"`);
    //Judge0 Submission
    const LangId = getlanguageId(language);
    if (!LangId) throw new Error("Unsupported language");
    const submission = [];
    for (const data of Problem.visibleTestcases) {
      submission.push({
        source_code: code + driver.code,
        language_id: LangId,
        stdin: data.input,
        expected_output: data.output,
      });
    }

    const submitResult = await submitBatch(submission);
    const resultToken = submitResult.map((value) => value.token);
    const FinalResult = await submitToken(resultToken);
    console.log(FinalResult);
    const ans = [];
    for (const data of FinalResult) {
      ans.push({
        stdin: data.stdin,
        stdout: data.stdout,
        status: data.status,
        memory: data.memory,
        time: Number(data.time) * 1000,
      });
    }
    res.status(200).send(ans);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const getSubmissionDetail = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result?._id;
    if (!userId) throw new Error("u Dont have access to this information...");
    if (!problemId) throw new Error("Something went wrong...");
    const detail = await SubmissionS.find({
      userId,
      problemId,
    }).sort({ createdAt: -1 });

    res.status(200).json(detail);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const getcontestSubmissionDetail = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const userId = req.result?._id;

    // 1. Authentication
    if (!userId) {
      return res.status(401).json({
        message: "User is not authenticated.",
      });
    }

    // 2. Contest ID
    if (!contest_id) {
      return res.status(400).json({
        message: "Contest is not selected.",
      });
    }

    // 3. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(contest_id)) {
      return res.status(400).json({
        message: "Invalid contest ID.",
      });
    }

    // 4. Check contest
    const contestResult = await Contest.findById(contest_id).select(
      "problem title startTime endTime status"
    );

    if (!contestResult) {
      return res.status(404).json({
        message: "Contest not found.",
      });
    }

    // 5. Check participation
    const isParticipated = await Contestparticipant.findOne({
      contest_id: contest_id,
      user_id: userId,
    });

    if (!isParticipated) {
      return res.status(403).json({
        message: "User did not participate in this contest.",
      });
    }

    // 6. Get accepted submissions
    const resultSubmission = await SubmissionS.find({
      contestId: contest_id,
      userId: userId,
      status: "Accepted",
    }).select("problemId");

    // 7. Store unique solved problems
    const solvedProblemIds = new Set();

    for (const submission of resultSubmission) {
      if (submission.problemId) {
        solvedProblemIds.add(submission.problemId.toString());
      }
    }

    // 8. Calculate score
    let solved = 0;
    let points = 0;

    for (const problem of contestResult.problem) {
      if (!problem.problemId) continue;

      if (solvedProblemIds.has(problem.problemId.toString())) {
        solved++;
        points += problem.points;
      }
    }

    // 9. Save result
    isParticipated.score = points;
    isParticipated.resultsCalculated = true;

    await isParticipated.save();

    // 10. Return result
    return res.status(200).json({
      title: contestResult.title,
      totalProblems: contestResult.problem.length,
      points,
      solved,
      solvedProblemIds: [...solvedProblemIds],
      message: "Contest submission details fetched successfully.",
    });

  } catch (error) {
    console.error("getcontestSubmissionDetail error:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching contest result.",
    });
  }
};

export default { SubmitCode, RunCode, getSubmissionDetail, getcontestSubmissionDetail};