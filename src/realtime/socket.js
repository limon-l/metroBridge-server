const { Server } = require("socket.io");
const { verifyJwt } = require("../config/jwt");
const { env } = require("../config/env");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

let ioInstance = null;

const allowedOrigins = new Set([
  ...env.clientUrls,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
]);

const createSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: Array.from(allowedOrigins),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")?.[1];

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyJwt(token);
      const user = await User.findById(decoded.sub).select(
        "_id fullName role isActive",
      );

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        id: user._id.toString(),
        fullName: user.fullName,
        role: user.role,
      };

      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.id}`);

    try {
      const conversations = await Conversation.find({
        participants: user.id,
      }).select("_id");
      conversations.forEach((conversation) => {
        socket.join(`conversation:${conversation._id.toString()}`);
      });
    } catch {
      // Non-fatal; the user can still receive direct room events.
    }

    socket.on("conversation:join", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });
  });

  ioInstance = io;
  return io;
};

const getSocketServer = () => ioInstance;

const emitMessageCreated = ({ conversationId, recipientIds = [], message }) => {
  if (!ioInstance) {
    return;
  }

  const payload = {
    conversationId: conversationId.toString(),
    message: {
      id: message.id || message._id?.toString(),
      senderId: message.senderId || message.sender?._id?.toString(),
      senderName: message.senderName || message.sender?.fullName || "Unknown",
      text: message.text || message.content || "",
      timestamp:
        message.timestamp || message.createdAt || new Date().toISOString(),
    },
  };

  ioInstance.to(`conversation:${conversationId}`).emit("message:new", payload);
  recipientIds.forEach((recipientId) => {
    ioInstance.to(`user:${recipientId}`).emit("message:new", payload);
  });
};

module.exports = {
  createSocketServer,
  getSocketServer,
  emitMessageCreated,
};
