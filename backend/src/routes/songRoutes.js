const express = require('express');
const router = express.Router();
const { getSongsByGenre } = require('../services/songService'); // ✅ Import service function
const asyncHandler = require('express-async-handler');

// ✅ Get songs by genre
router.get('/songs', asyncHandler(async (req, res) => {
    const genreCode = req.query.genre || "DM0000"; // Default to Top 100
    const songs = await getSongsByGenre(genreCode);
    res.json({ songs });
}));

module.exports = router;
