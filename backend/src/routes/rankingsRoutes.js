const express = require("express");
const router = express.Router();
const { getCache } = require("../services/cacheService");
const { getRankings } = require("../services/rankingsService");
const {
  getGenreRefreshStatus,
  queueGenreRefresh,
} = require("../services/chartRefreshService");

router.get("/scrape-status", async (req, res) => {
  const genreCode = req.query.genre || "DM0000";
  res.json(await getGenreRefreshStatus(genreCode));
});

// ✅ Fetch Rankings (Checks Cache, Scrapes if Needed)
router.get("/rankings", async (req, res) => {
  try {
    const genreCode = req.query.genre || "DM0000";

    // ✅ Check cache first
    const cachedData = getCache(genreCode);
    if (cachedData) {
      return res.json(cachedData);
    }

    await queueGenreRefresh(genreCode, { reason: "rankings_request" });

    const rankings = await getRankings(genreCode);

    res.json(rankings);

  } catch (error) {
    console.error("❌ Error fetching rankings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
