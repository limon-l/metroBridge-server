const { verifyJwt } = require("../config/jwt");
const User = require("../models/User");
const { asyncHandler } = require("../utils/helpers");

const auth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decoded = verifyJwt(token);
  const user = await User.findById(decoded.sub).select("-password");

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  return next();
});

const requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };

module.exports = { auth, requireRoles };
