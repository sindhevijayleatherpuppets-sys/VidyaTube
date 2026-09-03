const express = require("express");
const router = express.Router();
const {
  searchYouTube,
  getTrending,
  getVideo,
  getChannel,
  getShorts,
} = require("../controllers/youtubeController");

router.get("/search", searchYouTube);
router.get("/trending", getTrending);
router.get("/shorts", getShorts);
router.get("/videos/:id", getVideo);
router.get("/channels/:id", getChannel);

module.exports = router;
