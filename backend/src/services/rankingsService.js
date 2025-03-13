const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");
const { scrapeAndSaveGenre } = require("../services/scraperService");

const scrapingStatus = {}; // ✅ Track ongoing scraping jobs

// ✅ Get Scraping Status
function getScrapeStatus(genreCode) {
  return scrapingStatus[genreCode] || false;
}

/**
 * ✅ Determines if scraping is needed based on the last update timestamp and missing YouTube data.
 * @param {string} genreCode
 * @param {object} client - Database client
 * @returns {Promise<boolean>} - Returns true if scraping is needed
 */
async function shouldScrapeGenre(genreCode, client) {
  try {
    const result = await client.query(
      `SELECT g.last_updated 
       FROM genres g
       WHERE g.code = $1`,
      [genreCode]
    );

    if (result.rows.length === 0) return true; // ✅ If genre doesn't exist, scrape

    const { last_updated: lastUpdated } = result.rows[0];

    return (
      !lastUpdated ||  // ✅ If last_updated is NULL, force a scrape
      Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000  // ✅ Only scrape if last update was over 24 hours ago
    );
  } catch (error) {
    console.error(`❌ Error checking update conditions for ${genreCode}:`, error);
    return true; // ✅ Assume scraping is needed in case of error
  }
}

/**
 * ✅ Fetch rankings from cache or database, triggering a scrape if necessary
 * @param {string} genreCode
 * @returns {Promise<Object[]>} - Rankings data
 */
async function getRankings(genreCode) {
  console.log(`🟢 Checking cache for genre via rankingsService: ${genreCode}`);

  // ✅ Return cached data if available
  const cachedData = getCache(genreCode);
  if (cachedData) {
    console.log(
      `✅ Using cached data for ${genreCode} (updated recently). Skipping scrape.`
    );
    return cachedData; // ✅ Prevent scraping if cache exists
  }

  console.log(
    `🟢 Cache expired or missing. Checking database for last update...`
  );

  const client = await pool.connect();
  try {
    // ✅ Determine if scraping is necessary
    const needsScraping = await shouldScrapeGenre(genreCode, client);

    if (needsScraping) {
      console.log(`🔄 Scraping forced for genre: ${genreCode}`);
      await scrapeAndSaveGenre(genreCode);
    } else {
      console.log(`✅ Using existing DB data for genre: '${genreCode}'`);
    }

    // ✅ Fetch the updated rankings
    const rankingsResult = await client.query(
      `SELECT sr.rank, sr.movement, s.title, s.melon_song_id, a.name AS artist, s.album, s.art, 
              s.youtube_url, s.spotify_url
       FROM song_rankings sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE sr.genre_id = (SELECT id FROM genres WHERE code = $1)
       ORDER BY sr.rank ASC`,
      [genreCode]
    );

    const rankings = rankingsResult.rows;

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
module.exports = { getRankings, getScrapeStatus };
