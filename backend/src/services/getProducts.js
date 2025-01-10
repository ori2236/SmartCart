import { exec } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// הגדרת __dirname ידנית
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getProducts = (req, res) => {
  const { term, shopping_address } = req.query;

  if (!term || !shopping_address) {
    res
      .status(400)
      .json({
        error: "Missing required query parameters: term and shopping_address",
      });
    return;
  }

  // שימוש בנתיב יחסי
  const scriptPath = path.resolve(__dirname, "chp.py");

  exec(
    `python "${scriptPath}" "${term}" "${shopping_address}"`,
    (error, stdout, stderr) => {
      if (error) {
        res
          .status(500)
          .json({ error: `Error executing script: ${error.message}` });
        return;
      }
      if (stderr) {
        res.status(500).json({ error: `Script error: ${stderr}` });
        return;
      }

      try {
        const products = JSON.parse(stdout);
        res.status(200).json(products);
      } catch (err) {
        res.status(500).json({ error: `Error parsing output: ${err.message}` });
      }
    }
  );
};

export default getProducts;
