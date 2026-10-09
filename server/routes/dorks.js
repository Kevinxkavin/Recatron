const express = require("express");
const router = express.Router();
const { getCategories, getDorksByCategory, searchDorks } = require("../controllers/dorksController");

router.get("/categories", getCategories);
router.get("/search", searchDorks);
router.get("/:category", getDorksByCategory);

module.exports = router;
