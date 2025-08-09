const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    // Add connection timeout and error handling
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Global error handler for the socket server
  io.engine.on("connection_error", (err) => {
    console.log("Socket.IO connection error:", err);
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow connection but mark as unauthenticated
      socket.user = { anonymous: true };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn("Socket authentication failed:", err.message);
      // Allow connection but mark as unauthenticated
      socket.user = { anonymous: true };
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, socket.user?.email);

    // Add comprehensive error handling
    socket.on("error", (err) => {
      console.error(`Socket error for user ${socket.id}:`, err);
    });

    // Handle disconnect gracefully
    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
    });

    // Handle connection errors
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // Add socket-level error handling for write operations
    socket.conn.on('error', (err) => {
      if (err.code === 'EOF' || err.syscall === 'write') {
        console.log(`Socket write error handled for ${socket.id}:`, err.code);
      } else {
        console.error(`Socket connection error for ${socket.id}:`, err);
      }
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
