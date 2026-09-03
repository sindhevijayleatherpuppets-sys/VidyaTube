const express = require("express");
const {
  getHistory,
  addHistory,
  removeHistoryItem,
  clearHistory,
} = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getHistory);
router.post("/", protect, addHistory);
router.delete("/clear", protect, clearHistory);
router.delete("/:id", protect, removeHistoryItem);
router.delete("/", protect, clearHistory);

module.exports = router;
