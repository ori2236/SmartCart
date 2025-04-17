import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { connectDB } from "../../db/index.js";
import CartHistory from "../../models/CartHistory.js";

const uploadAll = async () => {
  await connectDB();

  const folderPath = path.resolve("./cart_histories"); 
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".csv"));

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const rows = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath, { encoding: "utf-8" })
        .pipe(
          csvParser({
            separator: ",",
            headers: [
              "cartKey",
              "productId",
              "productName",
              "quantity",
              "date",
            ],
            skipLines: 1,
          })
        )
        .on("data", (row) => {
          if (!row.date || !row.cartKey || !row.productId) {
            console.warn(`Skipping invalid row in ${file}:`, row);
            return;
          }
          rows.push({
            cartKey: row.cartKey,
            productId: row.productId,
            quantity: parseInt(row.quantity),
            date: new Date(row.date),
          });
        })
        .on("end", async () => {
          try {
            await CartHistory.insertMany(rows);
            console.log(`Imported ${rows.length} records from ${file}`);
            resolve();
          } catch (err) {
            console.error(`Error importing ${file}:`, err);
            reject(err);
          }
        });
    });
  }

  console.log("🚀 All carts uploaded successfully!");
  process.exit();
};

uploadAll();
