import problem from "../models/problem.js";
import SubmissionS from "../models/Submission.js";
import {
  getlanguageId,
  submitBatch,
  submitToken,
} from "../utils/Problemutility.js";

const SubmitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    const { code, language } = req.body;
    if (!userId || !problemId || !code || !language)
      return res.status(400).send("Field is Missing...");

    //Fetch The Problem
    const Problem = await problem.findById(problemId);
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

    await SubmittedResult.save();

    //Problem Id insert in User Schema problem section if it is not present
    if (
      SubmittedResult.status==="Accepted" &&
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

const getSubmissionDetail= async (req,res) =>{
  try{
    const {problemId}=req.params;
    const userId= req.result?._id;
    if(!userId)throw new Error("u Dont have access to this information...");
    if(!problemId)throw new Error("Something went wrong...");
    const detail=await SubmissionS.find({
      userId,
      problemId
    }).sort({createdAt: -1});

    res.status(200).json(detail);
  }
  catch(err){
    res.status(400).send("Error: "+err.message);
  }
};

export default { SubmitCode, RunCode , getSubmissionDetail};
