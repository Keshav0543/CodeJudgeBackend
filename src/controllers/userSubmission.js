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
    const driver=Problem.driverCode.find((data)=>data.language.toLowerCase()===language.toLowerCase());
    if(!driver)throw new Error(`No driver code for language "${language}"`);
    for (const data of Problem.invisibleTestcases) {
      submission.push({
        source_code: code+driver.code,
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
      if (result.status_id == 3) {
        testCasesPassed++;
        runtime += parseFloat(result.time) * 1000;
        memory = Math.max(result.memory, memory);
      } else {
        if (result.status_id == 4) {
          status = "error";
          errorMessage = result.stderr;
        } else {
          status = "wrong";
          errorMessage = result.stderr;
        }
      }
    }

    //Store the result in Database
    SubmittedResult.status = status;
    SubmittedResult.testCasesPassed = testCasesPassed;
    SubmittedResult.runtime = runtime;
    SubmittedResult.memory = memory;
    SubmittedResult.errorMessage = errorMessage;

    await SubmittedResult.save();

    //Problem Id insert in User Schema problem section if it is not present
    if (req.result.ProblemSolved.length==0 || !req.result.ProblemSolved.includes(problemId)) {
      req.result.ProblemSolved.push(problemId);
      await req.result.save();
    }
    res.status(201).send("Submitted_Result...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const RunCode= async (req,res) => {
  try{
    const { code, language } = req.body;
    const id=req.params.id;
    if(!id)throw new Error("Required Missing Field...");

    const Problem=await problem.findById(id);
    const driver=Problem.driverCode.find((data)=>data.language.toLowerCase()===language.toLowerCase());
    if(!driver)throw new Error(`No driver code for language "${language}"`);
    //Judge0 Submission
    const LangId = getlanguageId(language);
    if (!LangId)
    throw new Error("Unsupported language");
    const submission = [];
    for (const data of Problem.visibleTestcases) {
      submission.push({
        source_code: code+driver.code,
        language_id: LangId,
        stdin: data.input,
        expected_output: data.output,
      });
    }
    
    const submitResult = await submitBatch(submission);
    const resultToken = submitResult.map((value) => value.token);
    const FinalResult = await submitToken(resultToken);
    const ans=[];
    for(const data of FinalResult){
      ans.push({
      stdin:data.stdin,
      stdout:data.stdout,
      status:data.status,
      memory:data.memory,
      time:Number(data.time)*1000
      })
    }
    res.status(200).send(ans);
  }
  catch(err){
    res.status(400).send("Error: "+err.message);
  }
};

export default { SubmitCode, RunCode};