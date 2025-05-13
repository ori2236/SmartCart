import config from "./src/config.js";
import { createServer } from "http";
import app from "./src/app.js";
import { initSocket } from "./src/socket.js";
import Weights from "./src/models/Weights.js";
import { trainModel } from "./src/services/suggestions/predictPurchases.js";

const server = createServer(app);

initSocket(server);

server.listen(config.PORT, "0.0.0.0", () => {
  console.info(
    `Server is running on port: ${config.PORT}. pid: ${process.pid}.`
  );

  (async () => {
    try {
      //find the most recently updated weight
      const latest = await Weights.findOne().sort({ updatedAt: -1 }).lean();

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (latest && now - new Date(latest.updatedAt).getTime() < oneDay) {
        //the weights are updated
        return;
      }

      //time the training run
      console.time("trainModel duration");
      await trainModel();
      console.timeEnd("trainModel duration");

      if (latest) {
        console.log("retraining complete");
      } else {
        console.log("initial training complete");
      }
    } catch (err) {
      console.error("error checking/running model training:", err);
    }
  })();
});
