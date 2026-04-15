const express = require('express');
const router = express.Router();
const {
  getGenreRefreshStatus,
  queueGenreRefresh,
} = require("../services/chartRefreshService");
const asyncHandler = require('express-async-handler');

// ✅ Scrape and update rankings
router.get('/scrape', asyncHandler(async (req, res) => {
    const genreCode = req.query.genre || "DM0000"; // Default genre
    console.log(`🟢 Scraping initiated for genre: ${genreCode}`);

    const refresh = await queueGenreRefresh(genreCode, {
      force: true,
      reason: "manual_refresh",
    });

    res.status(202).json({
      success: true,
      queued: refresh.queued,
      alreadyRunning: refresh.alreadyRunning,
      status: await getGenreRefreshStatus(genreCode),
      message: `Refresh queued for genre: ${genreCode}`,
    });
}));

module.exports = router;
