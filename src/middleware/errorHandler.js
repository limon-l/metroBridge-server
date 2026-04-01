const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    message,
    details: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
