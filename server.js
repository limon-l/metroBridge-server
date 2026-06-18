require("dotenv").config();

const http = require("http");

const app = require("./src/app");
const { connectDatabase } = require("./src/config/database");
const { logger } = require("./src/config/logger");
const { env } = require("./src/config/env");
const { createSocketServer } = require("./src/realtime/socket");

const server = http.createServer(app);
createSocketServer(server);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Stop the existing process or change PORT in .env.`,
    );
    process.exit(1);
  }

  logger.error("Server runtime error", error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDatabase({ retries: 5, retryDelayMs: 1500 });
  } catch (error) {
    logger.warn(
      "MongoDB connection could not be established. Starting server in degraded mode.",
    );
  }

  server.listen(env.port, () => {
    logger.info(`API running on http://localhost:${env.port}`);
  });
};

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully.");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully.");
  server.close(() => process.exit(0));
});

startServer();
