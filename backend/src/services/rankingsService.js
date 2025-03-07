const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");
const { scrapeAndSaveGenre } = require("../services/scraperService")


const scrapingStatus = {}; // ✅ Track ongoing scraping jobs

// ✅ Get Scraping Status
function getScrapeStatus(genreCode) {
    return scrapingStatus[genreCode] || false;
}

// ✅ Fetch Rankings from Cache or Database
async function getRankings(genreCode) {
    console.log(`🟢 Checking cache for genre SKIPPED: ${genreCode}`);

    // 1️⃣ Check Cache First
    const cachedData = getCache(genreCode);
    if (cachedData) return cachedData;

    const client = await pool.connect();

    try {
        console.log(`🔄 Scraping forced for genre: ${genreCode}`);
        await scrapeAndSaveGenre(genreCode);

        const result = await client.query(
            `SELECT sr.rank, s.title, a.name AS artist, s.album, s.art, s.youtube_url, s.genius_url, s.spotify_url
             FROM song_rankings sr
             JOIN songs s ON sr.song_id = s.id
             JOIN artists a ON s.artist_id = a.id
             WHERE sr.genre_id = (SELECT id FROM genres WHERE code = $1)
             ORDER BY sr.rank ASC;`,
            [genreCode]
        );

        return result.rows;
    } catch (error) {
        console.error("❌ Error forcing scrape:", error);
        throw error;
    } finally {
        client.release(); // ✅ Always release the client
    }
}

module.exports = { getRankings, getScrapeStatus };
