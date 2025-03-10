import axios from "axios";
import pool from "../config/db"; // Database connection

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const cache = new Map();

/**
 * ✅ Fetch YouTube URL for a song using YouTube API
 */
export async function fetchYouTubeUrl(songTitle, artist) {
  const searchQuery = `${artist} ${songTitle} music video`;
  
  // ✅ 1️⃣ Check cache first
  if (cache.has(searchQuery)) {
    console.log("✅ Loaded YouTube link from cache");
    return cache.get(searchQuery);
  }

  // ✅ 2️⃣ Check database
  const client = await pool.connect();
  try {
    const dbResult = await client.query(
      "SELECT youtube_url FROM songs WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2)",
      [songTitle, artist]
    );

    if (dbResult.rows.length > 0 && dbResult.rows[0].youtube_url) {
      console.log("✅ Loaded YouTube link from database");
      cache.set(searchQuery, dbResult.rows[0].youtube_url);
      return dbResult.rows[0].youtube_url;
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    client.release();
  }

  // ✅ 3️⃣ Fetch from YouTube API if not found in cache or DB
  console.log(`🔍 Searching YouTube API for: ${searchQuery}`);

  try {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: YOUTUBE_API_KEY,
        q: searchQuery,
        part: "snippet",
        maxResults: 1, // Only fetch the first result
        type: "video", // Only fetch videos
      },
    });

    if (response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      console.log(`✅ Found YouTube Video: ${youtubeUrl}`);

      // ✅ 4️⃣ Save to database
      try {
        const client = await pool.connect();
        await client.query(
          "UPDATE songs SET youtube_url = $1 WHERE title = $2 AND artist_id = (SELECT id FROM artists WHERE name = $3)",
          [youtubeUrl, songTitle, artist]
        );
        client.release();
        console.log("✅ YouTube link saved to database");
      } catch (error) {
        console.error("❌ Failed to save YouTube URL to DB:", error);
      }

      // ✅ 5️⃣ Update cache
      cache.set(searchQuery, youtubeUrl);
      return youtubeUrl;
    }
  } catch (error) {
    console.error("❌ YouTube API request failed:", error);
  }

  return null;
}
