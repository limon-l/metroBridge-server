const express = require("express");
const { getOverviewStats } = require("../controllers/statsController");

const router = express.Router();

router.get("/overview", getOverviewStats);

module.exports = router;
