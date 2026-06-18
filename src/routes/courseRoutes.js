const express = require("express");

const { searchCourses } = require("../controllers/gatewayController");
const { checkRole } = require("../middleware/checkRole");

const router = express.Router();

router.get("/search", checkRole(["Student", "Mentor", "Admin"]), searchCourses);

module.exports = router;
