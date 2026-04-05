const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl:
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://metro-bridge.vercel.app"
      : "http://localhost:5173"),
  clientUrls: [
    process.env.CLIENT_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://metro-bridge.vercel.app"
        : "http://localhost:5173"),
    ...(process.env.NODE_ENV === "production"
      ? ["https://metro-bridge.vercel.app"]
      : []),
    ...(process.env.CLIENT_URLS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
};

const required = ["mongoUri", "jwtSecret"];

required.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = { env };
