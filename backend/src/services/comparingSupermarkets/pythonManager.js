import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pythonProcess = null;

//start the Python background server
export const startPythonServer = () => {
  const scriptPath = path.resolve(__dirname, "python_server.py");
  pythonProcess = spawn("python", [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8", //ensure UTF-8 encoding for correct Hebrew/Unicode
    },
  });

  pythonProcess.stdout.setEncoding("utf-8");
  pythonProcess.stderr.setEncoding("utf-8");

  pythonProcess.stderr.on("data", (data) => {
    console.error("[Python stderr]:", data.trim());
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Python process exited with code ${code}]`);
  });

  console.log("Python server started");
};

//send a payload (JS object) to Python, receive back a parsed JSON response
export const sendToPython = (payload) => {
  return new Promise((resolve, reject) => {
    if (!pythonProcess) {
      return reject(new Error("python server is not running"));
    }

    let buffer = "";

    const onData = (data) => {
      buffer += data.toString();

      try {
        //try to find complete JSON object inside the buffer
        const jsonStart = buffer.indexOf("{");
        const jsonEnd = buffer.lastIndexOf("}");

        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const completeJson = buffer.slice(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(completeJson);

          pythonProcess.stdout.off("data", onData);
          resolve(parsed);
        }
      } catch (error) {
        //still not a complete JSON, keep buffering
      }
    };

    pythonProcess.stdout.on("data", onData);

    //send JSON line to Python
    pythonProcess.stdin.write(JSON.stringify(payload) + "\n");
  });
};
