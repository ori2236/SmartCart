import { connectDB } from "../../db/index.js";
import Product from "../../models/Product.js";

import fs from "fs";


const exportProducts = async () => {
  await connectDB();
  const products = await Product.find({}, "_id name").lean();
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  console.log("✔ Products exported to products.json");
  process.exit();
};

exportProducts();

