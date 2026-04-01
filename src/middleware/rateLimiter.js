const rateLimit = require("express-rate-limit");

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, try again later.",
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication requests, try again later.",
  },
});

module.exports = { apiRateLimiter, authRateLimiter };
