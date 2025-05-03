import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { connectDB } from "../../../db/index.js";
import CartHistory from "../../../models/CartHistory.js";

const uploadAll = async () => {
  await connectDB();

  const folderPath = path.resolve("./cart_histories"); 
  const files = fs.readdirSync(folderPath).filter((file) => {
    if (!file.endsWith(".csv")) return false;
    const match = file.match(/cart_history_cart(\d+)\.csv/);
    if (!match) return false;
    const cartNumber = parseInt(match[1]);
    return cartNumber >= 22 && cartNumber <= 50;
  });


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
            console.log(`invalid row in ${file}:`, row);
            return;
          }

          let parsedDate = new Date(row.date);

          //DD/MM/YYYY => DD-MM-YYYY
          if (isNaN(parsedDate.getTime()) && row.date.includes("/")) {
            const [day, month, year] = row.date.split("/");
            if (day && month && year) {
              parsedDate = new Date(`${year}-${month}-${day}`);
            }
          }

          if (isNaN(parsedDate.getTime())) {
            console.warn(`invalid date in ${file}:`, row);
            return;
          }

          rows.push({
            cartKey: row.cartKey,
            productId: row.productId,
            quantity: parseInt(row.quantity) || 1,
            date: parsedDate,
          });
        })

        .on("end", async () => {
          try {
            await CartHistory.insertMany(rows);
            console.log(`imported ${rows.length} records from ${file}`);
            resolve();
          } catch (err) {
            console.error(`error importing ${file}:`, err);
            reject(err);
          }
        });
    });
  }

  console.log("🚀 all the carts uploaded");
  process.exit();
};

uploadAll();
