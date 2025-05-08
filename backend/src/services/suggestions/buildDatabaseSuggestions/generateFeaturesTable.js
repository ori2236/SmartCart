import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import { getFilteredProducts } from "../suggestions.js";

import { connectDB } from "../../../db/index.js";

async function generateFeaturesCSV(cartKey, mail) {
  try {
    //get the suggestions
    const features = await getFilteredProducts(cartKey, mail, 6);

    if (!features || features.size === 0) {
      console.log("no recommendations available");
      return;
    }

    //build feature rows for CSV
    const rows = [];
    for (const [pid, meta] of features.entries()) {
      rows.push({
        productId: pid,
        name: meta.product.name,
        bias: 1,
        isFavorite: meta.isFavorite ? 1 : 0,
        purchasedBefore: meta.purchasedBefore || 0,
        timesPurchased: meta.timesPurchased || 0,
        recentlyPurchased: meta.recentlyPurchased || 0,
        storeCount: meta.storeCount,
        timesWasRejectedByUser: meta.timesWasRejectedByUser,
        timesWasRejectedByCart: meta.timesWasRejectedByCart,
        label: "",
      });
    }

    //find the directory
    const outputDir = path.join(process.cwd(), "features");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    //write or append to cartKey.csv
    const fileName = `${cartKey}.csv`;
    const filePath = path.join(outputDir, fileName);

    const titles = Object.keys(rows[0]); //features name
    const headerLine = titles.join(",") + "\n";
    const body =
      rows
        .map((r) =>
          titles
            .map((t) => `"${String(r[t]).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n") + "\n";

    //write or append
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, headerLine + body, "utf8");
      console.log(`Created ${fileName}`);
    } else {
      fs.appendFileSync(filePath, body, "utf8");
      console.log(`Appended to ${fileName}`);
    }
  } catch (err) {
    console.error("feature table error:", err.message);
  }
}

async function main() {
  //node generateFeaturesCSV.js {cartKey} {mail}
  const [, , cartKey, mail] = process.argv;
  if (!cartKey || !mail) {
    console.error("cartKey and mail are required");
    process.exit(1);
  }
  try {
    await connectDB();
    await generateFeaturesCSV(cartKey, mail);
  } catch (err) {
    console.error("feature table error:", err);
    process.exit(1);
  }
}

/*
main()
  .then(() => {
    console.log("Done");
    return mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
*/