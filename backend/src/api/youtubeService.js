const axios = require("axios");
const pool = require("../config/db");
const { getCache, setCache } = require("../services/cacheService");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_REFRESH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

let stopYouTubeFetch = false; // ✅ Global flag to stop fetching after 403 error

/**
 * ✅ Fetch YouTube URL for a song from the API
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<string|null>} YouTube URL or null if not found
 */
async function fetchFromYouTube(title, artist) {
  if (stopYouTubeFetch) {
    console.warn(`🚫 Skipping YouTube fetch due to previous 403 error.`);
    return null;
  }

  try {
    console.log(`🔎 Searching YouTube for: ${title} - ${artist}`);
    const response = await axios.get(YOUTUBE_SEARCH_URL, {
      params: {
        key: YOUTUBE_API_KEY,
        q: `${title} ${artist} music video`,
        part: "snippet",
        type: "video",
        maxResults: 1,
      },
    });

    if (response.data.items.length === 0) {
      console.warn(`⚠️ No YouTube video found for ${title} - ${artist}`);
      return null;
    }

    const videoId = response.data.items[0].id.videoId;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch (error) {
    console.error(`❌ Error fetching YouTube data for ${title} - ${artist}:`, error);

    // ✅ If a 403 Forbidden error occurs, stop all further YouTube API calls
    if (error.response && error.response.status === 403) {
      console.error(`🚨 YouTube API quota exceeded! Stopping further requests.`);
      stopYouTubeFetch = true; // ✅ Prevent future API calls
    }

    return null;
  }
}

/**
 * ✅ Get or fetch YouTube URL for a song
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<string|null>} YouTube URL or null if not found
 */
async function fetchYouTubeUrl(title, artist) {
  if (stopYouTubeFetch) {
    console.warn(`🚫 Skipping YouTube fetch for ${title} - ${artist} due to quota limit.`);
    return null;
  }

  const cacheKey = `youtube_${title}_${artist}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`✅ Loaded YouTube URL from cache for ${title} - ${artist}`);
    return cachedData;
  }

  const client = await pool.connect();

  try {
    // ✅ Check database first
    const result = await client.query(
      `SELECT youtube_url, youtube_last_updated FROM songs 
       WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2 LIMIT 1)`,
      [title, artist]
    );

    if (result.rows.length > 0) {
      const { youtube_url, youtube_last_updated } = result.rows[0];

      // ✅ If URL is fresh, return it
      if (youtube_url && youtube_last_updated && Date.now() - new Date(youtube_last_updated).getTime() < YOUTUBE_REFRESH_MS) {
        console.log(`✅ Using existing YouTube URL for ${title} - ${artist}`);
        setCache(cacheKey, youtube_url);
        return youtube_url;
      }
    }

    // ✅ Fetch from YouTube API if missing or outdated
    const youtubeUrl = await fetchFromYouTube(title, artist);
    if (!youtubeUrl) return null;

    // ✅ Store in database
    await client.query(
      `UPDATE songs SET youtube_url = $1, youtube_last_updated = NOW() 
       WHERE title = $2 AND artist_id = (SELECT id FROM artists WHERE name = $3 LIMIT 1)`,
      [youtubeUrl, title, artist]
    );

    // ✅ Store in cache
    setCache(cacheKey, youtubeUrl);
    console.log(`✅ YouTube URL saved: ${youtubeUrl}`);

    return youtubeUrl;
  } catch (error) {
    console.error(`❌ Error fetching YouTube URL for ${title} - ${artist}:`, error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * ✅ Reset YouTube API fetch flag (Call this when a new genre scrape starts)
 */
function resetYouTubeQuota() {
  stopYouTubeFetch = false;
  console.log("🔄 Reset YouTube quota flag. Fetching enabled.");
}

module.exports = { fetchYouTubeUrl, resetYouTubeQuota };
