const express = require("express");
const { fetchYouTubeUrl } = require("../api/youtubeService");

const router = express.Router();

// ✅ Endpoint to fetch YouTube URL
router.get("/youtube", async (req, res) => {
  const { title, artist } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist parameter" });
  }

  try {
    const youtubeUrl = await fetchYouTubeUrl(title, artist);
    if (youtubeUrl) {
      res.json({ youtubeUrl });
    } else {
      res.status(404).json({ error: "YouTube video not found" });
    }
  } catch (error) {
    console.error("❌ Error fetching YouTube URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
