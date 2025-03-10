const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");
const { scrapeAndSaveGenre } = require("../services/scraperService");

const scrapingStatus = {}; // ✅ Track ongoing scraping jobs

// ✅ Get Scraping Status
function getScrapeStatus(genreCode) {
  return scrapingStatus[genreCode] || false;
}

// ✅ Fetch Rankings from Cache or Database
async function getRankings(genreCode) {
  console.log(`🟢 Checking cache for genre: ${genreCode}`);

  // ✅ Check if cache exists first
  const cachedData = getCache(genreCode);
  if (cachedData) {
    return cachedData;
  }

  const client = await pool.connect();

  try {
    // ✅ Check last update time in DB
    // ✅ Check last update time in DB and if any song is missing a YouTube URL
    const result = await client.query(
      `SELECT 
        g.last_updated, 
        EXISTS (
            SELECT 1 FROM songs s 
            JOIN song_rankings sr ON s.id = sr.song_id
            WHERE sr.genre_id = g.id 
            AND (s.youtube_url IS NULL OR s.youtube_last_updated IS NULL)
        ) AS missing_youtube
    FROM genres g
    WHERE g.code = $1`,
      [genreCode]
    );

    const lastUpdated = result.rows.length ? result.rows[0].last_updated : null;
    const missingYouTube = result.rows.length
      ? result.rows[0].missing_youtube
      : false;

    // ✅ If data is fresh and no missing YouTube links, skip scraping
    if (
      lastUpdated &&
      Date.now() - new Date(lastUpdated).getTime() < 24 * 60 * 60 * 1000 &&
      !missingYouTube
    ) {
      console.log(
        `✅ Using existing DB data for genre via rankingsService '${genreCode}'`
      );
    } else {
      console.log(
        `🔄 Scraping forced for genre: ${genreCode} (Missing YouTube: ${missingYouTube})`
      );
      await scrapeAndSaveGenre(genreCode);
    }

    // ✅ Now get the updated rankings
    const rankingsResult = await client.query(
      `SELECT sr.rank, s.title, a.name AS artist, s.album, s.art, s.youtube_url, s.genius_url, s.spotify_url
             FROM song_rankings sr
             JOIN songs s ON sr.song_id = s.id
             JOIN artists a ON s.artist_id = a.id
             WHERE sr.genre_id = (SELECT id FROM genres WHERE code = $1)
             ORDER BY sr.rank ASC;`,
      [genreCode]
    );

    const rankings = rankingsResult.rows;

    // ✅ Store in cache for future requests
    setCache(genreCode, rankings);

    return rankings;
  } catch (error) {
    console.error("❌ Error fetching rankings:", error);
    throw error;
  } finally {
    client.release(); // ✅ Always release the client
  }
}

module.exports = { getRankings, getScrapeStatus };
