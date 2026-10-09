const express = require("express");
const router = express.Router();
const { getHistory, deleteScan } = require("../controllers/historyController");

router.get("/", getHistory);
router.delete("/:id", deleteScan);

module.exports = router;
