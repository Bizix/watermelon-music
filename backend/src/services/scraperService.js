const pool = require("../config/db");
const { scrapeMelonCharts } = require("./scraper"); // ✅ Import scraper function

const cache = new Map();
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * ✅ Save Scraped Rankings to Database
 * @param {string} genreCode
 * @returns {Promise<Object[]>} Updated rankings
 */
async function saveToDatabase(genreCode = "DM0000") {
  console.log(`🟢 Checking cache for genre: ${genreCode}`);

  // ✅ 1️⃣ Check if cache exists & is valid
  const cachedData = cache.get(genreCode);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
    console.log(`✅ Loaded rankings from cache for genre: ${genreCode}`);
    return cachedData.data;
  }

  console.log(`🟢 Cache expired or missing. Fetching new data...`);

  const client = await pool.connect();

  try {
    console.log(`🟢 Scraping songs for genre: ${genreCode}`);
    const scrapedSongs = await scrapeMelonCharts(genreCode);

    await client.query("BEGIN"); // Start transaction

    // ✅ 2️⃣ Get the genre_id from the genres table
    const genreResult = await client.query(
      `SELECT id FROM genres WHERE code = $1`,
      [genreCode]
    );
    if (genreResult.rows.length === 0) {
      throw new Error(`Genre code '${genreCode}' not found in database.`);
    }
    const genreId = genreResult.rows[0].id;

    // ✅ 3️⃣ Insert or update songs
    for (const song of scrapedSongs) {
      await client.query(
        `INSERT INTO songs (title, artist_id, album, art, scraped_at) 
         VALUES ($1, (SELECT id FROM artists WHERE name = $2), $3, $4, NOW()) 
         ON CONFLICT (title, artist_id) DO UPDATE 
         SET album = EXCLUDED.album, art = EXCLUDED.art, scraped_at = NOW();`,
        [song.title, song.artist, song.album, song.art]
      );
    }

    // ✅ 4️⃣ Delete old rankings for the genre
    await client.query(`DELETE FROM song_rankings WHERE genre_id = $1`, [genreId]);

    // ✅ 5️⃣ Insert new rankings
    for (const song of scrapedSongs) {
      await client.query(
        `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
         VALUES ((SELECT id FROM songs WHERE title = $1 AND artist_id = 
         (SELECT id FROM artists WHERE name = $2)), $3, $4, NOW());`,
        [song.title, song.artist, genreId, song.rank]
      );
    }

    // ✅ 6️⃣ Store in cache
    cache.set(genreCode, { data: scrapedSongs, timestamp: Date.now() });

    await client.query("COMMIT");
    console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);
    return scrapedSongs;

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error saving to database:", error);
  } finally {
    client.release();
  }
}

/**
 * ✅ Wrapper to handle scraping & saving
 */
async function scrapeAndSaveGenre(genreCode) {
  try {
    console.log(`🔄 Starting scraping process for genre: ${genreCode}`);
    await saveToDatabase(genreCode);
    console.log(`✅ Successfully scraped and saved rankings for genre: ${genreCode}`);
  } catch (error) {
    console.error(`❌ Scraping failed for genre ${genreCode}:`, error);
    throw new Error(`Scraping process failed: ${error.message}`);
  }
}

module.exports = { saveToDatabase, scrapeAndSaveGenre };
