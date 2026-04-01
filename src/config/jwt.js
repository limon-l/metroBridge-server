const jwt = require("jsonwebtoken");
const { env } = require("./env");

const signJwt = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const verifyJwt = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { signJwt, verifyJwt };
