const express = require("express");
const { param } = require("express-validator");

const { toggleApprovalStatus } = require("../controllers/gatewayController");
const { checkRole } = require("../middleware/checkRole");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.put(
  "/approve/:id",
  checkRole(["Admin"]),
  [param("id").isMongoId()],
  validate,
  toggleApprovalStatus,
);

module.exports = router;
