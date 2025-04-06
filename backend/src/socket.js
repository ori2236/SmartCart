import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinCart", (cartKey) => {
      socket.join(cartKey);
    });

    socket.on("disconnect", () => {
    });
  });
}

export function emitCartUpdate(cartKey, update) {
  if (io) {
    io.to(cartKey).emit("cartUpdated", update);
  }
}
