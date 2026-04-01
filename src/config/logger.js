const logger = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};

const requestLoggerStream = {
  write: (message) => {
    const text = String(message).trim();
    if (text) {
      logger.info(text);
    }
  },
};

module.exports = { logger, requestLoggerStream };
