const express = require("express");
const router = express.Router();
const { runScan, getScanById } = require("../controllers/scanController");

router.post("/run", runScan);
router.get("/:id", getScanById);

module.exports = router;
