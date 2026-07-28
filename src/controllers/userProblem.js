import {
  getlanguageId,
  submitBatch,
  submitToken,
} from "../utils/Problemutility.js";
import Problem from "../models/problem.js";
import user from "../models/user.js";

const NewProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficultylevel,
      tags,
      visibleTestcases,
      invisibleTestcases,
      startCode,
      referenceSolution,
      problemCreator,
    } = req.body;

    for (const initialC of referenceSolution) {
      const submission = [];
      const languageid = getlanguageId(initialC.language);
      for (const data of visibleTestcases) {
        submission.push({
          source_code: initialC.initialCode,
          language_id: languageid,
          stdin: data.input,
          expected_output: data.output,
        });
      }
      const submitResult = await submitBatch(submission);
      const resultToken = submitResult.map((value) => value.token);
      const FinalResult = await submitToken(resultToken);

      for (let i = 0; i < FinalResult.length; i++) {
        const test = FinalResult[i];
        const testcase = visibleTestcases[i];

        // Hard failures — inme output compare karne ka koi matlab nahi
        if (test.status.id === 6) {
          throw new Error(
            `Compilation Error [${initialC.language}]: ${test.compile_output}`,
          );
        }
        if (test.status.id >= 7 && test.status.id <= 12) {
          throw new Error(
            `Runtime Error [${initialC.language}] on input "${testcase.input}": ${test.stderr}`,
          );
        }
        if (test.status.id === 5) {
          throw new Error(
            `Time Limit Exceeded [${initialC.language}] on input "${testcase.input}" (${test.time}s)`,
          );
        }

        // Output khud compare karo — Judge0 ke null-vs-empty quirk se bachne ke liye
        const actual = (test.stdout || "").trim();
        const expected = (testcase.output || "").trim();

        if (actual !== expected) {
          throw new Error(
            `Reference solution failed [${initialC.language}] on input "${testcase.input}": Expected "${expected}" | Got "${actual}"`,
          );
        }
      }
    }

    //Store in Database
    const Userproblem = await Problem.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(200).send("Problem Created Successfully...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const UpdateProblem = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title,
      description,
      difficultylevel,
      tags,
      visibleTestcases,
      invisibleTestcases,
      startCode,
      referenceSolution,
      problemCreator,
    } = req.body;

    for (const initialC of referenceSolution) {
      const submission = [];
      const languageid = getlanguageId(initialC.language);
      for (const data of visibleTestcases) {
        submission.push({
          source_code: initialC.initialCode,
          language_id: languageid,
          stdin: data.input,
          expected_output: data.output,
        });
      }
      const submitResult = await submitBatch(submission);
      const resultToken = submitResult.map((value) => value.token);
      const FinalResult = await submitToken(resultToken);

      for (let i = 0; i < FinalResult.length; i++) {
        const test = FinalResult[i];
        const testcase = visibleTestcases[i];

        // Hard failures — inme output compare karne ka koi matlab nahi
        if (test.status.id === 6) {
          throw new Error(
            `Compilation Error [${initialC.language}]: ${test.compile_output}`,
          );
        }
        if (test.status.id >= 7 && test.status.id <= 12) {
          throw new Error(
            `Runtime Error [${initialC.language}] on input "${testcase.input}": ${test.stderr}`,
          );
        }
        if (test.status.id === 5) {
          throw new Error(
            `Time Limit Exceeded [${initialC.language}] on input "${testcase.input}" (${test.time}s)`,
          );
        }

        // Output khud compare karo — Judge0 ke null-vs-empty quirk se bachne ke liye
        const actual = (test.stdout || "").trim();
        const expected = (testcase.output || "").trim();

        if (actual !== expected) {
          throw new Error(
            `Reference solution failed [${initialC.language}] on input "${testcase.input}": Expected "${expected}" | Got "${actual}"`,
          );
        }
      }
    }

    if (!id) throw new Error("Missing Id Field");

    const DsaProb = await Problem.findById(id);
    if (!DsaProb) throw new Error("Required Valid Id...");

    const update = await Problem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).send("Problem Updated SuccessFully...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const DeleteProblem = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("Id is required...");

    const DsaProb = await Problem.findById(id);
    if (!DsaProb) throw new Error("Invalid Id...");
    await Problem.findByIdAndDelete(id);

    res.status(200).send("Problem Deleted SuccessFully...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const FetchProblem = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("Id is missing...");

    const DsaProb = await Problem.findById(id).select(
      "title description difficultylevel tags  visibleTestcases  startCode referenceSolution",
    );
    if (!DsaProb) throw new Error("Required Valid Id...");

    res.status(200).send(DsaProb);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const getAllProblem = async (req, res) => {
  try {
    const AllProb = await Problem.find({}).select("title tags difficultylevel");
    if (AllProb.length == 0) throw new Error("Problem is missing...");
    res.status(200).send(AllProb);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const SolvedProblem = async (req, res) => {
  try {
    const id = req.result._id;

    if (!id) throw new Error("Required Id...");

    const ProblemSolve = req.result.ProblemSolved;
    if (ProblemSolve.length == 0)
     return res.status(200).json([]);

    const UserInfo = await req.result.populate("ProblemSolved", "title tags");

    const TitleInfo = UserInfo.ProblemSolved;

    res.status(200).send(TitleInfo);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const searchProblem = async (req,res) => {
  try{
    const q=req.query.q?.trim();
    if(!q)return res.status(200).json([]);

    const result=await Problem.find({
      title:{
        $regex:"^"+q,
        $options:"i"
      }
    }).select("_id title difficultylevel tags").limit(10);

    res.status(200).json(result);
  }
  catch(error){
    res.status(500).send("Error: "+error.message);
  }
};

export default {
  NewProblem,
  UpdateProblem,
  DeleteProblem,
  FetchProblem,
  getAllProblem,
  SolvedProblem,
  searchProblem
};
