import axios from "axios";

const getlanguageId = (lang) => {
  lang = lang.toLowerCase();
  const language = {
    "c++": 54,
    "java": 62,
    "javascript": 63,
  };
  if (!(lang in language)) throw new Error("Language not supported...");
  return language[lang];
};

// ---- Base64 helpers ----
const toBase64 = (str) => {
  return Buffer.from(str ?? "", "utf-8").toString("base64");
};

const fromBase64 = (b64) => {
  if (!b64) return b64; // keep null/undefined/empty as-is
  return Buffer.from(b64, "base64").toString("utf-8");
};

const submitBatch = async (submissions) => {
  try {
    // Encode source_code, stdin, expected_output before sending
    const encodedSubmissions = submissions.map((s) => ({
      ...s,
      source_code: toBase64(s.source_code),
      stdin: toBase64(s.stdin),
      expected_output: toBase64(s.expected_output),
    }));

    const options = {
      method: "POST",
      url: "https://ce.judge0.com/submissions/batch",
      params: {
        base64_encoded: "true",
        wait: "true",
        fields:
          "stdout,stderr,status_id,status,token,time,memory,compile_output,message,expected_output,stdin",
      },
      headers: {
        "content-type": "application/json",
      },
      data: {
        submissions: encodedSubmissions,
      },
    };

    const response = await axios(options);
    return response.data;
  } catch (err) {
    throw new Error("Judge0 batch submission failed: " + err.message);
  }
};

const submitToken = async (resultToken) => {
  const token = resultToken.join(",");
  try {
    while (1) {
      const result = await axios.get(
        `https://ce.judge0.com/submissions/batch`,
        {
          params: {
            tokens: token,
            base64_encoded: "true",
            fields:
              "stdout,stderr,status_id,status,token,time,memory,compile_output,message,expected_output,stdin",
          },
        }
      );
      const results = result.data.submissions;
      const isCompleted = results.every((ans) => ans.status.id > 2);
      if (isCompleted) {
        // Decode all base64 fields before returning to the rest of the app
        return results.map((r) => ({
          ...r,
          stdout: fromBase64(r.stdout),
          stderr: fromBase64(r.stderr),
          compile_output: fromBase64(r.compile_output),
          message: fromBase64(r.message),
          expected_output: fromBase64(r.expected_output),
          stdin: fromBase64(r.stdin),
        }));
      }
      await waiting(2000);
    }
  } catch (err) {
    console.error("Judge0 GET error body:", err.response?.data);
    throw new Error(
      "Judge0 batch Tokenizer Step failed: " +
        JSON.stringify(err.response?.data || err.message)
    );
  }
};

const waiting = async (timer) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), timer);
  });
};

export { getlanguageId, submitBatch, submitToken };