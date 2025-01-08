import express from "express";
import cors from "cors";
import config from "./src/config.js";
import { createServer } from "http";
import app from "./src/app.js";

const server = createServer(app);

server.listen(config.PORT, () => {
  console.info(
    `Server is running on port: ${config.PORT}. pid: ${process.pid}.`
  );
});
