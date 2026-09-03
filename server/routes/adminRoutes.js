const express = require("express");
const {
  getStats,
  getAllUsers,
  deleteUser,
  getAllVideos,
  removeVideo,
  getAllReports,
  resolveReport,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route here requires a logged-in admin
router.use(protect, adminOnly);

router.get("/stats", getStats);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

router.get("/videos", getAllVideos);
router.delete("/videos/:id", removeVideo);

router.get("/reports", getAllReports);
router.put("/reports/:id", resolveReport);

module.exports = router;
