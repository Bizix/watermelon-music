const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const { saveToDatabase } = require('../services/scraper');

const cache = new Map(); // 🛠 In-memory cache
let scrapingStatus = {}; // 🟢 Tracks if scraping is in progress per genre

// ✅ Check scraping status
router.get('/scrape-status', (req, res) => {
    const genreCode = req.query.genre || "DM0000";
    res.json({ scraping: scrapingStatus[genreCode] || false });
});

router.get('/rankings', async (req, res) => {
    const genreCode = req.query.genre || "DM0000";
    console.log(`🟢 Checking cache/database for genre: ${genreCode}`);

    // 1️⃣ Check cache first
    if (cache.has(genreCode)) {
        const { data, timestamp } = cache.get(genreCode);
        const hoursSinceLastUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);

        if (hoursSinceLastUpdate <= 24) {
            console.log(`✅ Using cached rankings for ${genreCode} (updated ${hoursSinceLastUpdate.toFixed(1)} hours ago)`);
            return res.json(data);
        }
    }

    const client = await pool.connect();

    try {
        // 2️⃣ Check DB for last update timestamp
        const checkTimestamp = await client.query(`
            SELECT sr.rank, s.title, a.name AS artist, s.album, s.art, s.youtube_url, s.genius_url, s.spotify_url, g.last_updated 
            FROM song_rankings sr
            JOIN songs s ON sr.song_id = s.id
            JOIN artists a ON s.artist_id = a.id
            JOIN genres g ON sr.genre_id = g.id
            WHERE g.code = $1
            ORDER BY sr.rank ASC;
        `, [genreCode]);

        if (checkTimestamp.rows.length > 0) {
            const lastUpdated = checkTimestamp.rows[0].last_updated;
            const hoursSinceLastUpdate = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60);

            if (hoursSinceLastUpdate <= 24) {
                console.log(`✅ Using DB rankings for ${genreCode} (updated ${hoursSinceLastUpdate.toFixed(1)} hours ago)`);

                // 3️⃣ Store DB results in cache
                cache.set(genreCode, { data: checkTimestamp.rows, timestamp: Date.now() });

                return res.json(checkTimestamp.rows);
            }
        }

        console.log(`🔄 Scraping needed for genre: ${genreCode}`);
        scrapingStatus[genreCode] = true; // ✅ Set scraping status

        const newSongs = await saveToDatabase(genreCode);

        scrapingStatus[genreCode] = false; // ✅ Scraping is done

        // 4️⃣ Fetch updated data from DB after scraping
        const updatedRankings = await client.query(`
            SELECT sr.rank, s.title, a.name AS artist, s.album, s.art, s.youtube_url, s.genius_url, s.spotify_url 
            FROM song_rankings sr
            JOIN songs s ON sr.song_id = s.id
            JOIN artists a ON s.artist_id = a.id
            WHERE sr.genre_id = (SELECT id FROM genres WHERE code = $1)
            ORDER BY sr.rank ASC;
        `, [genreCode]);

        // 5️⃣ Store new data in cache
        cache.set(genreCode, { data: updatedRankings.rows, timestamp: Date.now() });

        res.json(updatedRankings.rows);
    } catch (error) {
        scrapingStatus[genreCode] = false; // ✅ Reset scraping status if an error occurs
        console.error("❌ Error fetching rankings:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
