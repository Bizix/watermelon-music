const express = require('express');
const { saveToDatabase } = require('../services/scraper');

const router = express.Router();

router.get('/scrape', async (req, res) => {
    try {
        await saveToDatabase();
        res.json({ success: true, message: 'Scraping completed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;