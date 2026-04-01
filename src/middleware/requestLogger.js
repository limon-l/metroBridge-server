const { logger } = require("../config/logger");

const requestLogger = (req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

module.exports = { requestLogger };
