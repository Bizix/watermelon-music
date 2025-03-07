const pool = require("../config/db");
const { scrapeMelonCharts } = require("./scraper");
const { getCache, setCache } = require("./cacheService");

const genreMap = {
    "DM0000": "Top 100",
    "GN0100": "Ballads",
    "GN0200": "K-Pop",
    "GN0300": "K-Rap",
    "GN0400": "R&B",
    "GN0500": "Indie",
    "GN0600": "Rock",
    "GN0700": "Trot",
    "GN0800": "Folk",
    "GN1500": "OST",
    "GN1700": "Jazz",
    "GN1800": "New Age",
    "GN1900": "J-Pop",
    "GN2200": "Children",
    "GN2400": "Korean Traditional",
};

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * ✅ Save Scraped Rankings to Database
 * @param {string} genreCode
 * @returns {Promise<Object[]>} Updated rankings
 */
async function saveToDatabase(genreCode = "DM0000") {
  console.log(`🟢 Checking cache for genre: ${genreCode}`);

  // ✅ 1️⃣ Check if cached data is still valid
  const cachedData = getCache(genreCode);
  if (cachedData && cachedData.length > 0) {
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
       RETURNING id, last_updated`,
      [genreCode, genreMap[genreCode] || 'Unknown']
    );

    const genreId = genreResult.rows[0].id;
    const lastUpdated = genreResult.rows[0].last_updated;

    // ✅ 3️⃣ If last update is within 24 hours, return data from DB instead of scraping
    const existingData = await client.query(
      `SELECT s.id, s.title, a.name AS artist, s.album, s.art, sr.rank 
       FROM song_rankings sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE sr.genre_id = $1
       ORDER BY sr.rank ASC`,
      [genreId]
    );

    if (existingData.rows.length > 0 && lastUpdated && (Date.now() - new Date(lastUpdated).getTime() < CACHE_EXPIRATION)) {
      console.log(`✅ Data for genre '${genreCode}' was recently updated. Using existing DB data.`);
      setCache(genreCode, existingData.rows); // ✅ Cache the result
      return existingData.rows;
    }

    console.log(`🟢 No existing data or outdated. Scraping new data for genre: ${genreCode}...`);
    
    // ✅ 4️⃣ Scrape fresh rankings
    const scrapedSongs = await scrapeMelonCharts(genreCode);

    await client.query("BEGIN"); // Start transaction

    // ✅ 5️⃣ Ensure all artists exist
    const existingArtistsRes = await client.query(`SELECT id, name FROM artists`);
    const existingArtists = new Map(existingArtistsRes.rows.map(a => [a.name, a.id]));

    const artistIds = {};
    for (const song of scrapedSongs) {
      if (!existingArtists.has(song.artist)) {
        const artistRes = await client.query(
          `INSERT INTO artists (name) VALUES ($1) 
           ON CONFLICT (name) DO NOTHING RETURNING id`,
          [song.artist]
        );
        if (artistRes.rows.length > 0) {
          artistIds[song.artist] = artistRes.rows[0].id;
          existingArtists.set(song.artist, artistRes.rows[0].id);
        } else {
          artistIds[song.artist] = existingArtists.get(song.artist);
        }
      } else {
        artistIds[song.artist] = existingArtists.get(song.artist);
      }
    }

    // ✅ 6️⃣ Ensure all songs exist
    const existingSongsRes = await client.query(`SELECT id, title, artist_id FROM songs`);
    const existingSongs = new Map(existingSongsRes.rows.map(s => [`${s.title}-${s.artist_id}`, s.id]));

    const songIds = {};
    for (const song of scrapedSongs) {
      const songKey = `${song.title}-${artistIds[song.artist]}`;
      if (!existingSongs.has(songKey)) {
        const songRes = await client.query(
          `INSERT INTO songs (title, artist_id, album, art, scraped_at) 
           VALUES ($1, $2, $3, $4, NOW()) 
           ON CONFLICT (title, artist_id) 
           DO UPDATE SET album = EXCLUDED.album, art = EXCLUDED.art, scraped_at = NOW()
           RETURNING id`,
          [song.title, artistIds[song.artist], song.album, song.art]
        );
        songIds[songKey] = songRes.rows[0].id;
        existingSongs.set(songKey, songRes.rows[0].id);
      } else {
        songIds[songKey] = existingSongs.get(songKey);
      }
    }

    // ✅ 7️⃣ Insert or update rankings
    for (const song of scrapedSongs) {
      const songId = songIds[`${song.title}-${artistIds[song.artist]}`];

      await client.query(
        `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (song_id, genre_id) 
         DO UPDATE SET rank = EXCLUDED.rank, scraped_at = NOW()`,
        [songId, genreId, song.rank]
      );
    }

    // ✅ 8️⃣ Update last_updated timestamp for the genre
    await client.query(
      `UPDATE genres SET last_updated = NOW() WHERE id = $1`,
      [genreId]
    );

    await client.query("COMMIT"); // ✅ Commit transaction
    console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);

    setCache(genreCode, scrapedSongs); // ✅ Store in cache
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
