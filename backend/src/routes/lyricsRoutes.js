const express = require("express");
const { getLyrics } = require("../services/lyricsService");

const router = express.Router();

/**
 * ✅ GET /api/lyrics?title=<song_title>&artist=<artist_name>
 * Fetch lyrics for a song, checking the database first, then scraping Genius.
 */
router.get("/", async (req, res) => {
  const { title, artist, songId } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist parameter." });
  }

  try {
    console.log(`🎶 Fetching lyrics for: ${title} - ${artist}`);

    const lyrics = await getLyrics(title, artist, songId);

    if (lyrics) {
      res.json({ title, artist, lyrics });
    } else {
      res.status(404).json({ error: "Lyrics not found." });
    }
  } catch (error) {
    console.error(`❌ Error fetching lyrics:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
