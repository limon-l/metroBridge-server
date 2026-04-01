const express = require("express");
const { listMentors } = require("../controllers/mentorController");

const router = express.Router();

router.get("/", listMentors);

module.exports = router;
