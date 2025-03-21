const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");

const scrapingStatus = {}; // ✅ Track ongoing scraping jobs

// ✅ Get Scraping Status
function getScrapeStatus(genreCode) {
  return scrapingStatus[genreCode] || false;
}

/**
 * ✅ Determines if scraping is needed based on the last update timestamp and missing YouTube data.
 * @param {string} genreCode
 * @returns {Promise<boolean>} - Returns true if scraping is needed
 */
async function shouldScrapeGenre(genreCode) {
  // ✅ Check cache first
  const cacheKey = `genre_last_updated_${genreCode}`;
  const lastUpdated = getCache(cacheKey);

  if (lastUpdated) {
    // ✅ If last updated within 24h, no need to scrape
    return Date.now() - lastUpdated > 24 * 60 * 60 * 1000;
  }

  // ✅ If cache is empty, fall back to DB query
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT g.last_updated 
       FROM genres g
       WHERE g.code = $1`,
      [genreCode]
    );

    if (result.rows.length === 0) return true; // ✅ If genre doesn't exist, scrape

    const dbLastUpdated = new Date(result.rows[0].last_updated).getTime();
    setCache(cacheKey, dbLastUpdated); // ✅ Store last updated time in cache

    return Date.now() - dbLastUpdated > 24 * 60 * 60 * 1000;
  } catch (error) {
    console.error(
      `❌ Error checking update conditions for ${genreCode}:`,
      error
    );
    return true; // ✅ Assume scraping is needed in case of error
  } finally {
    client.release();
  }
}

/**
 * ✅ Fetch rankings from database, triggering a scrape if necessary
 * @param {string} genreCode
 * @returns {Promise<Object[]>} - Rankings data
 */
async function getRankings(genreCode) {
  const client = await pool.connect();
  try {
    // ✅ Fetch the updated rankings
    const rankingsResult = await client.query(
      `SELECT s.id, sr.rank, sr.movement, s.title, s.melon_song_id, a.name AS artist, s.album, s.art, 
              s.youtube_url, s.spotify_url, sl.lyrics
       FROM song_rankings sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       LEFT JOIN song_lyrics sl ON sl.song_id = s.id
       WHERE sr.genre_id = (SELECT id FROM genres WHERE code = $1)
       ORDER BY sr.rank ASC`,
      [genreCode]
    );

    let rankings = rankingsResult.rows;
    console.log(`✅ Using database data for ${genreCode}`);

    // ✅ Do NOT auto-fetch missing lyrics, return `null`
    rankings = rankings.map(song => ({
      ...song,
       lyrics: song.lyrics || null // Ensure missing lyrics return `null` instead of undefined
    }));

    // ✅ Store results in cache
    setCache(genreCode, rankings);
    return rankings;
  } catch (error) {
    console.error("❌ Error fetching rankings:", error);
    throw error;
  } finally {
    client.release(); // ✅ Always release DB client
  }
}

// ✅ Export services
module.exports = { getRankings, getScrapeStatus, shouldScrapeGenre };
