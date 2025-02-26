router.get('/songs', async (req, res) => {
    const genreCode = req.query.genre || "DM0000"; // Default to Top 100

    try {
        const genreResult = await pool.query('SELECT id FROM genres WHERE code = $1', [genreCode]);
        if (genreResult.rows.length === 0) {
            return res.json({ songs: [] });
        }

        const genreId = genreResult.rows[0].id;

        const songsResult = await pool.query(`
            SELECT songs.id, songs.title, artists.name AS artist, songs.album, songs.art, song_rankings.rank
            FROM song_rankings
            JOIN songs ON song_rankings.song_id = songs.id
            JOIN artists ON songs.artist_id = artists.id
            WHERE song_rankings.genre_id = $1
            ORDER BY CAST(NULLIF(song_rankings.rank, 'N/A') AS INTEGER) ASC NULLS LAST;
        `, [genreId]);

        res.json({ songs: songsResult.rows });
    } catch (error) {
        console.error("❌ Error fetching songs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
