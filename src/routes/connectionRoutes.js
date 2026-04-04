const express = require("express");
const { body, param, query } = require("express-validator");

const {
  getMemberDirectory,
  sendConnectionRequest,
  listConnectionRequests,
  respondToConnectionRequest,
  getMemberProfile,
  disconnectMember,
  reportMember,
} = require("../controllers/connectionController");
const { auth, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth, requireRoles("student", "mentor", "admin"));

router.get(
  "/members",
  [
    query("role").optional().isIn(["student", "mentor"]),
    query("q").optional().trim().isLength({ max: 100 }),
  ],
  validate,
  getMemberDirectory,
);

router.get(
  "/requests",
  [
    query("type").optional().isIn(["all", "incoming", "sent"]),
    query("status").optional().isIn(["pending", "approved", "rejected"]),
  ],
  validate,
  listConnectionRequests,
);

router.post(
  "/requests",
  [body("recipientId").isMongoId()],
  validate,
  sendConnectionRequest,
);

router.patch(
  "/requests/:requestId/respond",
  [param("requestId").isMongoId(), body("action").isIn(["approve", "reject"])],
  validate,
  respondToConnectionRequest,
);

router.get(
  "/members/:memberId/profile",
  [param("memberId").isMongoId()],
  validate,
  getMemberProfile,
);

router.delete(
  "/members/:memberId/connection",
  [param("memberId").isMongoId()],
  validate,
  disconnectMember,
);

router.post(
  "/members/:memberId/report",
  [
    param("memberId").isMongoId(),
    body("reason").trim().isLength({ min: 5, max: 500 }),
  ],
  validate,
  reportMember,
);

module.exports = router;
