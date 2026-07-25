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

      for (const test of FinalResult) {
        if (test.status.id > 3) {
          throw new Error(
            `Reference solution failed on a visible testcase: ${test.status.description}`,
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

      for (const test of FinalResult) {
        if (test.status.id > 3) {
          throw new Error(
            `Reference solution failed on a visible testcase: ${test.status.description}`,
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

    const DsaProb = await Problem
      .findById(id)
      .select(
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
      throw new Error("No Problem Solved Right Now...");

    const UserInfo = await req.result.populate("ProblemSolved","title tags");

    const TitleInfo = UserInfo.ProblemSolved;

    res.status(200).send(TitleInfo);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

export default {
  NewProblem,
  UpdateProblem,
  DeleteProblem,
  FetchProblem,
  getAllProblem,
  SolvedProblem,
};
