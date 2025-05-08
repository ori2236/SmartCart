// importAllFeatures.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

import { connectDB } from "../../../db/index.js";
import TrainingExample from "../../../models/TrainingExample.js";

async function uploadSuggestions(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const featureOrder = [
      "bias",
      "isFavorite",
      "purchasedBefore",
      "timesPurchased",
      "recentlyPurchased",
      "storeCount",
      "timesWasRejectedByUser",
      "timesWasRejectedByCart",
    ];

    const examples = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        const features = featureOrder.map((f) => Number(row[f] || 0));
        const label = Number(row.label);
        examples.push({ features, label });
      })
      .on("end", async () => {
        if (examples.length === 0) {
          console.warn(`No rows found in ${fileName}, skipping.`);
          return resolve();
        }
        try {
          await TrainingExample.insertMany(examples);
          console.log(`Imported ${examples.length} examples from ${fileName}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

/*
async function main() {
  await connectDB();

  //find the directory
  const dir = path.join(process.cwd(), "features");
  if (!fs.existsSync(dir)) {
    console.error(`directory not found: ${dir}`);
    process.exit(1);
  }

  //find the files
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    console.warn("no CSV files found in features");
    await mongoose.disconnect();
    return;
  }

  for (const fileName of files) {
    const filePath = path.join(dir, fileName);
    try {
      await uploadSuggestions(filePath, fileName);
    } catch (err) {
      console.error(`Error importing ${fileName}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log("All files processed. Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
*/
