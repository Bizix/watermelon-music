const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/rankings', async (req, res) => {
    const { genre } = req.query;

    if (!genre) {
        return res.status(400).json({ error: "Genre code is required" });
    }

    try {
        const result = await pool.query(
            `SELECT s.id, sr.rank, s.title, a.name AS artist, s.album, 
                    s.youtube_url, s.genius_url, s.spotify_url
             FROM song_rankings sr
             JOIN songs s ON sr.song_id = s.id
             JOIN artists a ON s.artist_id = a.id
             JOIN genres g ON sr.genre_id = g.id
             WHERE g.code = $1 AND sr.rank != 'N/A'
             ORDER BY sr.rank ASC;`,
            [genre]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching rankings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
