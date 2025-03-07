const pool = require('../config/db'); // ✅ Import DB connection

/**
 * Fetch songs for a given genre from the database.
 * @param {string} genreCode - The genre code (e.g., "DM0000" for Top 100).
 * @returns {Promise<Array>} - Array of songs.
 */
async function getSongsByGenre(genreCode) {
    try {
        // ✅ Get genre ID
        const genreResult = await pool.query('SELECT id FROM genres WHERE code = $1', [genreCode]);
        if (genreResult.rows.length === 0) {
            return [];
        }

        const genreId = genreResult.rows[0].id;

        // ✅ Get ranked songs for the genre
        const songsResult = await pool.query(`
            SELECT 
                songs.id, 
                songs.title, 
                artists.name AS artist, 
                songs.album, 
                songs.art, 
                song_rankings.rank
            FROM song_rankings
            JOIN songs ON song_rankings.song_id = songs.id
            JOIN artists ON songs.artist_id = artists.id
            WHERE song_rankings.genre_id = $1
            ORDER BY CAST(NULLIF(song_rankings.rank, 'N/A') AS INTEGER) ASC NULLS LAST;
        `, [genreId]);

        return songsResult.rows;
    } catch (error) {
        console.error("❌ Error fetching songs:", error);
        throw new Error("Database query failed");
    }
}

module.exports = { getSongsByGenre };
