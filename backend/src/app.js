import express from "express";
import routes from "./routes/index.js"
import { connectDB } from "./db/index.js"
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

connectDB();
app.use(cors());
app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use("/api", routes)
    
export default app;