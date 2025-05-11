import { Server } from "socket.io";
import suggestions from "./services/suggestions/suggestions.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
  });

  io.on("connection", (socket) => {
    socket.on("joinCart", (cartKey) => {
      socket.join(cartKey);
    });

    socket.on("startSuggestions", async ({ cartKey, mail, k = 3 }) => {
      try {
        const onRound = (round) => {
          socket.emit("round", { round });
        };
        const response = await suggestions(cartKey, mail, k, onRound);
        socket.emit("done", { response });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });
  });
}


export function emitCartUpdate(cartKey, update) {
  if (io) {
    io.to(cartKey).emit("cartUpdated", update);
  }
}

export function emitFavoritesUpdate(userMail, update) {
  if (io) {
    io.to(`favorites-${userMail}`).emit("favoritesUpdated", update);
  }
}