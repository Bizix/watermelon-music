const pool = require("../config/db");
const { scrapeMelonCharts } = require("./scraper");
const { getCache, setCache } = require("./cacheService");
const { fetchYouTubeUrl, resetYouTubeQuota } = require("../api/youtubeService");
const { fetchSpotifyUrl } = require("../api/spotifyService");

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
              s.youtube_url, s.youtube_last_updated, s.spotify_url, sr.scraped_at
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
 * ✅ Batch update YouTube & Spotify URLs for a genre.
 * @param {Object[]} songs
 * @param {string} platform - 'youtube' or 'spotify'
 */
async function updateStreamingUrlsForGenre(songs, platform) {
  if (!["youtube", "spotify"].includes(platform)) {
    console.error(`❌ Invalid platform: ${platform}`);
    return;
  }

  const client = await pool.connect();
  const column = platform === "youtube" ? "youtube_url" : "spotify_url";
  const fetchFunction =
    platform === "youtube" ? fetchYouTubeUrl : fetchSpotifyUrl;
  const updates = [];

  try {
    for (const song of songs) {
      if (!song[column]) {
        console.log(
          `🔎 Fetching ${platform.toUpperCase()} URL for: ${song.title} - ${
            song.artist
          }`
        );

        try {
          const newUrl =
            platform === "youtube"
              ? await fetchFunction(song.title, song.artist)
              : await fetchFunction(song.title, song.artist, song.album);

          if (newUrl) {
            updates.push({ id: song.id, url: newUrl });
            song[column] = newUrl; // ✅ Update in-memory reference
          }
        } catch (error) {
          console.error(
            `❌ Failed to fetch ${platform.toUpperCase()} URL for ${
              song.title
            } - ${song.artist}`
          );
        }
      }
    }

    // ✅ Batch update in the database
    if (updates.length > 0) {
      const updateQueries = updates.map(({ id, url }) =>
        client.query(`UPDATE songs SET ${column} = $1 WHERE id = $2`, [url, id])
      );
      await Promise.all(updateQueries);
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
    console.log(
      `✅ Using cached data for ${genreCode} (updated recently). Skipping scrape.`
    );
    return cachedData; // ✅ Stop execution before trying to scrape
  }

  console.log(
    `🟢 Cache expired or missing. Checking database for last update...`
  );

  const client = await pool.connect();

  try {
    // ✅ 2️⃣ Ensure genre exists in the database
    const genreResult = await client.query(
      `INSERT INTO genres (code, name) 
       VALUES ($1, COALESCE($2, 'Unknown')) 
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name 
       RETURNING id, last_updated`,
      [genreCode, genreMap[genreCode] || "Unknown"]
    );

    const genreId = genreResult.rows[0].id;
    const lastUpdated = genreResult.rows[0].last_updated;

    // ✅ 3️⃣ Fetch existing rankings before inserting new ones
    const existingRankings = await fetchExistingRankings(genreId);
    const previousSongIds = new Set(existingRankings.map((song) => song.id));
    const newSongIds = new Set();

    // ✅ If no cache, check last scrape time from database
    const lastScrapeTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (lastScrapeTime && Date.now() - lastScrapeTime < TWENTY_FOUR_HOURS) {
      console.log(
        `✅ Rankings were scraped recently (within 24 hours). Using existing DB data.`
      );
      setCache(genreCode, existingRankings); // ✅ Store existing rankings in cache
      return existingRankings;
    }

    // ✅ 4️⃣ Scrape and process new data
    const scrapedSongs = await scrapeMelonCharts(genreCode);

    await client.query("BEGIN"); // ✅ Start transaction

    // ✅ 5️⃣ Ensure all artists exist
    const existingArtistsRes = await client.query(
      `SELECT id, name FROM artists`
    );
    const existingArtists = new Map(
      existingArtistsRes.rows.map((a) => [a.name, a.id])
    );

    const artistIds = {};
    for (const song of scrapedSongs) {
      if (!existingArtists.has(song.artist)) {
        const artistRes = await client.query(
          `INSERT INTO artists (name) VALUES ($1) 
           ON CONFLICT (name) DO NOTHING RETURNING id`,
          [song.artist]
        );
        artistIds[song.artist] = artistRes.rows.length
          ? artistRes.rows[0].id
          : existingArtists.get(song.artist);
        existingArtists.set(song.artist, artistIds[song.artist]);
      } else {
        artistIds[song.artist] = existingArtists.get(song.artist);
      }
    }

    // ✅ 6️⃣ Ensure all songs exist
    const songIds = {};
    for (const song of scrapedSongs) {
      const songRes = await client.query(
        `INSERT INTO songs (title, artist_id, album, art, youtube_url, youtube_last_updated, spotify_url, scraped_at) 
         VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW()) 
         ON CONFLICT (title, artist_id) 
         DO UPDATE SET album = EXCLUDED.album, art = EXCLUDED.art, scraped_at = NOW()
         RETURNING id`,
        [song.title, artistIds[song.artist], song.album, song.art]
      );
      const songId = songRes.rows[0].id;
      songIds[song.title] = songId;
      newSongIds.add(songId);
    }

    // ✅ 7️⃣ Insert or update rankings
    for (const song of scrapedSongs) {
      await client.query(
        `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (song_id, genre_id) 
         DO UPDATE SET rank = EXCLUDED.rank, scraped_at = NOW()`,
        [songIds[song.title], genreId, song.rank]
      );
    }

    // ✅ 8️⃣ Identify songs that dropped off the chart and mark them as "N/A"
    const droppedSongIds = [...previousSongIds].filter(
      (id) => !newSongIds.has(id)
    );
    if (droppedSongIds.length > 0) {
      console.log(
        `⚠️ Marking ${droppedSongIds.length} songs as "N/A" for genre: ${genreCode}`
      );
      await client.query(
        `UPDATE song_rankings SET rank = 0 WHERE song_id = ANY($1) AND genre_id = $2`,
        [droppedSongIds, genreId]
      );
    }

    await client.query("COMMIT"); // ✅ Commit transaction

    await client.query(`UPDATE genres SET last_updated = NOW() WHERE id = $1`, [
      genreId,
    ]);

    console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);

    // ✅ 9️⃣ Fetch updated rankings and filter out rank = 0 songs
    const rankedSongs = (await fetchExistingRankings(genreId)).filter(
      (song) => song.rank !== 0
    );

    await updateStreamingUrlsForGenre(rankedSongs, "youtube");
    await updateStreamingUrlsForGenre(rankedSongs, "spotify");

    if (scrapedSongs.length > 0) {
      setCache(genreCode, rankedSongs);
    } else {
      console.warn(`⚠️ Not updating cache since no new scrape occurred.`);
    }

    // return updatedRankings;

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
    console.log(
      `✅ Successfully scraped and saved rankings for genre: ${genreCode}`
    );
  } catch (error) {
    console.error(`❌ Scraping failed for genre ${genreCode}:`, error);
    throw new Error(`Scraping process failed: ${error.message}`);
  }
}

// ✅ Ensure it's exported
module.exports = { saveToDatabase, scrapeAndSaveGenre };
