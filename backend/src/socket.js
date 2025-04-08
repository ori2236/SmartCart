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

    socket.on("joinUserFavorites", (userMail) => {
      socket.join(`favorites-${userMail}`);
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

export function emitFavoritesUpdate(userMail, update) {
  if (io) {
    io.to(`favorites-${userMail}`).emit("favoritesUpdated", update);
  }
}