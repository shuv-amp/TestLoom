const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = user;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, socket.user?.email);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`User ${socket.user?.email || socket.id} joined room ${room}`);
    });

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`User ${socket.user?.email || socket.id} left room ${room}`);
    });

    socket.on("chatMessage", (data) => {
      io.to(data.room).emit("chatMessage", {
        user: socket.user?.email || 'Anonymous',
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };
