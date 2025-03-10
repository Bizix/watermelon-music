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
 * ✅ Fetch existing rankings from the database.
 * @param {number} genreId
 * @returns {Promise<Object[]>} Rankings data
 */
async function fetchExistingRankings(genreId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT s.id, s.title, a.name AS artist, s.album, s.art, sr.rank, 
              s.youtube_url, s.youtube_last_updated
       FROM song_rankings sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE sr.genre_id = $1
       ORDER BY sr.rank ASC`,
      [genreId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * ✅ Update missing or outdated YouTube URLs for a genre.
 * @param {Object[]} songs
 */
async function updateYouTubeUrlsForGenre(songs) {
  const client = await pool.connect();
  try {
    for (const song of songs) {
      if (!song.youtube_url || song.youtube_url.trim() === "" || !song.youtube_last_updated) {
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
  } finally {
    client.release();
  }
}

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

    // ✅ 3️⃣ Fetch existing rankings
    const existingRankings = await fetchExistingRankings(genreId);
    if (existingRankings.length > 0) {
      console.log(`✅ Using existing DB data for genre '${genreCode}'`);
      
      // ✅ 4️⃣ Update YouTube URLs if needed
      await updateYouTubeUrlsForGenre(existingRankings);

      // ✅ Cache and return updated data
      setCache(genreCode, existingRankings);
      return existingRankings;
    }

    console.log(`🟢 No recent rankings found, scraping new data...`);
    
    // ✅ 5️⃣ Scrape and process new data
    const scrapedSongs = await scrapeMelonCharts(genreCode);
    await client.query("BEGIN"); // ✅ Start transaction

    // ✅ 6️⃣ Ensure all artists exist
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
        artistIds[song.artist] = artistRes.rows.length ? artistRes.rows[0].id : existingArtists.get(song.artist);
        existingArtists.set(song.artist, artistIds[song.artist]);
      } else {
        artistIds[song.artist] = existingArtists.get(song.artist);
      }
    }

    // ✅ 7️⃣ Ensure all songs exist
    const songIds = {};
    for (const song of scrapedSongs) {
      const songRes = await client.query(
        `INSERT INTO songs (title, artist_id, album, art, youtube_url, youtube_last_updated, scraped_at) 
         VALUES ($1, $2, $3, $4, NULL, NULL, NOW()) 
         ON CONFLICT (title, artist_id) 
         DO UPDATE SET album = EXCLUDED.album, art = EXCLUDED.art, scraped_at = NOW()
         RETURNING id`,
        [song.title, artistIds[song.artist], song.album, song.art]
      );
      songIds[song.title] = songRes.rows[0].id;
    }

    // ✅ 8️⃣ Insert or update rankings
    for (const song of scrapedSongs) {
      await client.query(
        `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (song_id, genre_id) 
         DO UPDATE SET rank = EXCLUDED.rank, scraped_at = NOW()`,
        [songIds[song.title], genreId, song.rank]
      );
    }

    await client.query("COMMIT"); // ✅ Commit transaction

    console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);

    // ✅ 9️⃣ Update YouTube URLs for new songs
    const updatedRankings = await fetchExistingRankings(genreId);
    await updateYouTubeUrlsForGenre(updatedRankings);

    setCache(genreCode, updatedRankings);
    return updatedRankings;
  } catch (error) {
    await client.query("ROLLBACK");
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

module.exports = { saveToDatabase, scrapeAndSaveGenre };
