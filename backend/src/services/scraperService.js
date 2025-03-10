const pool = require("../config/db");
const { scrapeMelonCharts } = require("./scraper");
const { getCache, setCache } = require("./cacheService");
const { fetchYouTubeUrl, resetYouTubeQuota } = require("../api/youtubeService");

const genreMap = {
  DM0000: "Top 100",
  GN0100: "Ballads",
  GN0200: "K-Pop",
  GN0300: "K-Rap",
  GN0400: "R&B",
  GN0500: "Indie",
  GN0600: "Rock",
  GN0700: "Trot",
  GN0800: "Folk",
  GN1500: "OST",
  GN1700: "Jazz",
  GN1800: "New Age",
  GN1900: "J-Pop",
  GN2200: "Children",
  GN2400: "Korean Traditional",
};

/**
 * ✅ Save Scraped Rankings to Database
 * @param {string} genreCode
 * @returns {Promise<Object[]>} Updated rankings
 */
async function saveToDatabase(genreCode = "DM0000") {
  console.log(`🟢 Checking cache for genre: ${genreCode}`);

  // ✅ 1️⃣ Check if cached data is still valid
  const cachedData = getCache(genreCode);
  if (cachedData) {
    console.log(`✅ Loaded rankings from cache for genre: ${genreCode}`);
    return cachedData;
  }

  console.log(`🟢 Cache expired or missing. Checking database for last update...`);
  const client = await pool.connect();

  try {
    // ✅ 2️⃣ Ensure genre exists in the database
    const genreResult = await client.query(
      `INSERT INTO genres (code, name) 
       VALUES ($1, COALESCE($2, 'Unknown')) 
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name 
       RETURNING id`,
      [genreCode, genreMap[genreCode] || "Unknown"]
    );

    const genreId = genreResult.rows[0].id;

    // ✅ 3️⃣ Fetch existing songs regardless of scraping status
    const existingData = await client.query(
      `SELECT s.id, s.title, a.name AS artist, s.album, s.art, sr.rank, 
       COALESCE(s.youtube_url, NULL) AS youtube_url, 
       COALESCE(s.youtube_last_updated, NULL) AS youtube_last_updated
        FROM song_rankings sr
        JOIN songs s ON sr.song_id = s.id
        JOIN artists a ON s.artist_id = a.id
        WHERE sr.genre_id = $1
        ORDER BY sr.rank ASC`,
      [genreId]
    );

    if (existingData.rows.length > 0) {
      console.log(`✅ Using existing DB data for genre '${genreCode}'`);

      // ✅ Update YouTube URLs even if scraping isn't triggered
      for (const song of existingData.rows) {
        if (
          !song.youtube_url ||
          song.youtube_url.trim() === "" ||
          song.youtube_last_updated === null ||
          isNaN(new Date(song.youtube_last_updated).getTime())
        ) {
          console.log(`🔎 Fetching YouTube URL for: ${song.title} - ${song.artist}`);

          try {
            const newYoutubeUrl = await fetchYouTubeUrl(song.title, song.artist);
            if (newYoutubeUrl) {
              await client.query(
                `UPDATE songs SET youtube_url = $1, youtube_last_updated = NOW()
                 WHERE id = $2`,
                [newYoutubeUrl, song.id]
              );
              song.youtube_url = newYoutubeUrl; // ✅ Update in-memory reference
            }
          } catch (error) {
            console.error(`❌ Failed to fetch YouTube URL for ${song.title} - ${song.artist}`);
          }
        }
      }

      // ✅ Cache and return updated data
      setCache(genreCode, existingData.rows);
    }

    return existingData.rows;
  } catch (error) {
    console.error("❌ Error saving to database:", error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * ✅ Scrape and Save Genre
 * @param {string} genreCode
 */
async function scrapeAndSaveGenre(genreCode) {
  try {
    console.log(`🔄 Starting scraping process for genre: ${genreCode}`);
    
    resetYouTubeQuota(); // ✅ Reset YouTube quota flag before each scrape
    
    await saveToDatabase(genreCode);
    console.log(`✅ Successfully scraped and saved rankings for genre: ${genreCode}`);
  } catch (error) {
    console.error(`❌ Scraping failed for genre ${genreCode}:`, error);
    throw new Error(`Scraping process failed: ${error.message}`);
  }
}

// ✅ Ensure it's exported
module.exports = { saveToDatabase, scrapeAndSaveGenre };
