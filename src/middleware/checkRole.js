const IdentityUser = require("../models/IdentityUser");
const { firebaseAdmin } = require("../config/firebaseAdmin");

const normalizeRole = (value) => {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (role === "admin") return "Admin";
  if (role === "mentor") return "Mentor";
  if (role === "student") return "Student";

  return value;
};

const extractBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");
  return scheme === "Bearer" ? token : null;
};

const verifyFirebaseToken = async (authorizationHeader) => {
  const token = extractBearerToken(authorizationHeader);

  if (!token) {
    const error = new Error("Missing Firebase bearer token");
    error.statusCode = 401;
    throw error;
  }

  return firebaseAdmin.auth().verifyIdToken(token);
};

const checkRole =
  (allowedRoles = []) =>
  async (req, res, next) => {
    try {
      const decoded = await verifyFirebaseToken(
        req.headers.authorization || "",
      );
      const firebaseUid = decoded.uid || decoded.user_id || decoded.sub;

      const identityUser = await IdentityUser.findOne({ uid: firebaseUid });

      if (!identityUser) {
        return res.status(401).json({ message: "User profile is not synced" });
      }

      const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
      const normalizedUserRole = normalizeRole(identityUser.role);

      if (
        normalizedAllowedRoles.length > 0 &&
        !normalizedAllowedRoles.includes(normalizedUserRole)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (
        normalizedUserRole !== "Admin" &&
        identityUser.approvalStatus !== "Approved"
      ) {
        return res.status(403).json({ message: "Account approval is pending" });
      }

      req.firebaseUser = decoded;
      req.identityUser = identityUser;
      return next();
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return res.status(statusCode).json({ message: "Unauthorized" });
    }
  };

module.exports = { checkRole, verifyFirebaseToken };
