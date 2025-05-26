import express from "express";
import routes from "./routes/index.js"
import { connectDB } from "./db/index.js"
import cors from "cors";

const app = express();

connectDB();
app.use(cors());
app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use("/api", routes)
app.get('/healthcheck', (req, res) => {
  res.send('OK');
});
    
export default app;
