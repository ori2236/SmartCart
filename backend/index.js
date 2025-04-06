import config from "./src/config.js";
import { createServer } from "http";
import app from "./src/app.js";
import { initSocket } from "./src/socket.js";

const server = createServer(app);

initSocket(server);

server.listen(config.PORT, "0.0.0.0", () => {
  console.info(
    `Server is running on port: ${config.PORT}. pid: ${process.pid}.`
  );
});

