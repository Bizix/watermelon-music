const express = require('express');
const router = express.Router();
const { scrapeAndSaveGenre } = require('../services/scraperService'); // ✅ Import service function
const asyncHandler = require('express-async-handler');

// ✅ Scrape and update rankings
router.get('/scrape', asyncHandler(async (req, res) => {
    const genreCode = req.query.genre || "DM0000"; // Default genre
    console.log(`🟢 Scraping initiated for genre: ${genreCode}`);

    await scrapeAndSaveGenre(genreCode);

    res.json({ success: true, message: `Scraped and updated rankings for genre: ${genreCode}` });
}));

module.exports = router;
