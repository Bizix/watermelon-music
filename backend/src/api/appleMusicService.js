const axios = require("axios");
const pool = require("../config/db");
const { getCache, setCache } = require("../services/cacheService");

const APPLE_MUSIC_API_KEY = process.env.APPLE_MUSIC_API_KEY;
const APPLE_MUSIC_SEARCH_URL = "https://api.music.apple.com/v1/catalog/us/search";
const APPLE_MUSIC_REFRESH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

let stopAppleMusicFetch = false; // ✅ Global flag to stop fetching after 429 error
/**
 * ✅ Fetch Apple Music URL for a song from the API
 * @param {string} title
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<string|null>} Apple Music URL or null if not found
 */
async function fetchFromAppleMusic(title, artist, album) {
  if (stopAppleMusicFetch) {
    console.warn(`🚫 Skipping Apple Music fetch due to previous 429 error.`);
    return null;
  }

  try {
    console.log(`🔎 Searching Apple Music for: ${title} - ${artist} - ${album}`);
    const response = await axios.get(APPLE_MUSIC_SEARCH_URL, {
      headers: {
        Authorization: `Bearer ${APPLE_MUSIC_API_KEY}`,
      },
      params: {
        term: `${title} ${artist} ${album}`,
        types: "songs",
        limit: 1,
      },
    });

    if (!response.data.results.songs || response.data.results.songs.data.length === 0) {
      console.warn(`⚠️ No Apple Music track found for ${title} - ${artist} - ${album}`);
      return null;
    }

    const trackUrl = response.data.results.songs.data[0].attributes.url;
    return trackUrl;
  } catch (error) {
    console.error(`❌ Error fetching Apple Music data for ${title} - ${artist} - ${album}:`, error);

    // ✅ If a 429 Too Many Requests error occurs, stop all further Apple Music API calls
    if (error.response && error.response.status === 429) {
      console.error(`🚨 Apple Music API quota exceeded! Stopping further requests.`);
      stopAppleMusicFetch = true;
    }

    return null;
  }
}

/**
 * ✅ Get or fetch Apple Music URL for a song
 * @param {string} title
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<string|null>} Apple Music URL or null if not found
 */
async function fetchAppleMusicUrl(title, artist, album) {
  if (stopAppleMusicFetch) {
    console.warn(`🚫 Skipping Apple Music fetch for ${title} - ${artist} - ${album} due to quota limit.`);
    return null;
  }

  const cacheKey = `applemusic_${title}_${artist}_${album}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`✅ Loaded Apple Music URL from cache for ${title} - ${artist} - ${album}`);
    return cachedData;
  }

  const client = await pool.connect();

  try {
    // ✅ Check database first
    const result = await client.query(
      `SELECT apple_music_url, apple_music_last_updated FROM songs 
       WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2 LIMIT 1) AND album = $3`,
      [title, artist, album]
    );

    if (result.rows.length > 0) {
      const { apple_music_url, apple_music_last_updated } = result.rows[0];

      // ✅ If URL is fresh, return it
      if (apple_music_url && apple_music_last_updated && Date.now() - new Date(apple_music_last_updated).getTime() < APPLE_MUSIC_REFRESH_MS) {
        console.log(`✅ Using existing Apple Music URL for ${title} - ${artist} - ${album}`);
        setCache(cacheKey, apple_music_url);
        return apple_music_url;
      }
    }

    // ✅ Fetch from Apple Music API if missing or outdated
    const appleMusicUrl = await fetchFromAppleMusic(title, artist, album);
    if (!appleMusicUrl) return null;

    // ✅ Store in database
    await client.query(
      `UPDATE songs SET apple_music_url = $1, apple_music_last_updated = NOW() 
       WHERE title = $2 AND artist_id = (SELECT id FROM artists WHERE name = $3 LIMIT 1) AND album = $4`,
      [appleMusicUrl, title, artist, album]
    );

    // ✅ Store in cache
    setCache(cacheKey, appleMusicUrl);
    console.log(`✅ Apple Music URL saved: ${appleMusicUrl}`);

    return appleMusicUrl;
  } catch (error) {
    console.error(`❌ Error fetching Apple Music URL for ${title} - ${artist} - ${album}:`, error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * ✅ Reset Apple Music API fetch flag (Call this when a new genre scrape starts)
 */
function resetAppleMusicQuota() {
  stopAppleMusicFetch = false;
  console.log("🔄 Reset Apple Music quota flag. Fetching enabled.");
}

module.exports = { fetchAppleMusicUrl, resetAppleMusicQuota };
