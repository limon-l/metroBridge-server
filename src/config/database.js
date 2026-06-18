const mongoose = require("mongoose");
const { env } = require("./env");
const { logger } = require("./logger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let _memoryServer = null;

let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection established");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB connection re-established");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Waiting for automatic reconnection.");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", error);
  });
};

const connectDatabase = async ({ retries = 5, retryDelayMs = 1500 } = {}) => {
  mongoose.set("strictQuery", true);
  registerConnectionListeners();

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20,
        retryWrites: true,
      });
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt > retries) {
        break;
      }

      const delayMs = retryDelayMs * attempt;
      logger.warn(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${delayMs}ms.`,
      );
      await sleep(delayMs);
    }
  }

  // If we're in development and cannot reach the configured MongoDB,
  // attempt to start an in-memory MongoDB instance so the server can run.
  if ((env.nodeEnv || "development") !== "production") {
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      _memoryServer = await MongoMemoryServer.create({
        binary: { version: "6.0.8" },
      });
      const uri = _memoryServer.getUri();
      logger.warn("Falling back to in-memory MongoDB for local development.");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20,
        retryWrites: true,
      });
      return;
    } catch (memErr) {
      logger.error("Failed to start in-memory MongoDB", memErr);
      throw lastError;
    }
  }

  throw lastError;
};

const stopMemoryServer = async () => {
  try {
    if (_memoryServer) {
      await mongoose.disconnect();
      await _memoryServer.stop();
      _memoryServer = null;
      logger.info("In-memory MongoDB stopped");
    }
  } catch (err) {
    logger.warn("Error while stopping in-memory MongoDB", err);
  }
};

module.exports = { connectDatabase };
