import util from "util";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// encode JSON to Base64
const encodeBase64 = (jsonObj) => {
  return Buffer.from(JSON.stringify(jsonObj), "utf-8").toString("base64");
};

const runScript = async (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const process = spawn("python", [scriptPath, ...args]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(stderr.trim() || `Process exited with code ${code}`)
        );
      }
      try {
        resolve(stdout.trim());
      } catch (error) {
        reject(error);
      }
    });
  });
};

const getBestSupermarkets = async (req, res) => {
  try {
    const { cart, address, alpha = 0.5 } = req.body;

    if (!cart || !address) {
      return res
        .status(400)
        .json({ error: "Missing shopping cart or address" });
    }

    const encodedCart = encodeBase64(cart);

    const pythonScriptPath = path.resolve(__dirname, "bestBranches.py");

    const pythonOutput = await runScript(pythonScriptPath, [
      encodedCart,
      address,
      alpha.toString(),
    ]);

    // parse JSON response
    const { supermarkets, recommendations } = JSON.parse(pythonOutput);

    res.status(200).json({ supermarkets, recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getBestSupermarkets;