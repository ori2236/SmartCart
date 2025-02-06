import config from "./src/config.js";
import { createServer } from "http";
import app from "./src/app.js";

const server = createServer(app);

server.listen(config.PORT, "0.0.0.0", () => {
  console.info(
    `Server is running on port: ${config.PORT}. pid: ${process.pid}.`
  );
});

