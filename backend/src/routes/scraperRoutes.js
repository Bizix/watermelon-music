const express = require('express');
const router = express.Router();
const { saveToDatabase } = require('../services/scraper');

router.get('/scrape', async (req, res) => {
    const genreCode = req.query.genre || "DM0000";  // ✅ Get genre from request, default to "DM0000"
    
    console.log(`🟢 Received request to scrape genre: ${genreCode}`);
    
    try {
        await saveToDatabase(genreCode);
        res.json({ success: true, message: `Scraped and updated rankings for genre: ${genreCode}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
