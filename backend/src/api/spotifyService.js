const axios = require("axios");
const pool = require("../config/db");
const levenshtein = require("fast-levenshtein");
const { getCache, setCache } = require("../services/cacheService");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

let spotifyAccessToken = null;
let tokenExpirationTime = 0;

/**
 * ✅ Obtain Spotify Access Token
 */
async function getSpotifyAccessToken() {
  if (spotifyAccessToken && Date.now() < tokenExpirationTime) {
    return spotifyAccessToken; // ✅ Use cached token if still valid
  }

  try {
    const response = await axios.post(
      SPOTIFY_AUTH_URL,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    spotifyAccessToken = response.data.access_token;
    tokenExpirationTime = Date.now() + response.data.expires_in * 1000; // Set expiration time

    console.log("✅ Spotify Access Token Obtained");
    return spotifyAccessToken;
  } catch (error) {
    console.error(
      "❌ Failed to get Spotify access token:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * ✅ Search for a Song on Spotify
 * @param {string} title
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<string|null>} Spotify URL or null if not found
 */
async function fetchFromSpotify(title, artist, album) {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) return null;

    console.log(`🔎 Searching Spotify for: ${title} ${artist}  ${album}`);

    const response = await axios.get(SPOTIFY_SEARCH_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: `${artist} ${title}`,
        type: "track",
        limit: 5,
      },
    });

    const tracks = response.data.tracks.items;

    if (tracks.length > 0) {
      const normalize = (str) =>
        str
          .toLowerCase()
          .replace(/[^\w\s]/gi, "") // Remove special characters
          .trim();

      const normalizedTitle = normalize(title);
      const normalizedArtist = normalize(artist);
      const normalizedAlbum = album ? normalize(album) : null; // Album might be null

      let bestMatch = null;
      let bestScore = Infinity;

      for (const track of tracks) {
        const trackTitle = normalize(track.name);
        const trackAlbum = normalize(track.album.name);
        const trackArtists = track.artists.map((a) => normalize(a.name));

        // 🔹 Calculate similarity scores
        const titleDistance = levenshtein.get(normalizedTitle, trackTitle);
        const albumDistance = normalizedAlbum
          ? levenshtein.get(normalizedAlbum, trackAlbum)
          : 0;
        const artistMatch = trackArtists.includes(normalizedArtist) ? 0 : 10; // Penalize mismatched artist

        // 🔹 Calculate total score (lower is better)
        const totalScore = titleDistance + albumDistance + artistMatch;

        // 🔹 Select the best match with the lowest score
        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestMatch = track;
        }
      }
      if (bestMatch) {
        console.log(
          `✅ Closest match: ${bestMatch.name} by ${bestMatch.artists
            .map((a) => a.name)
            .join(", ")}`
        );
        return bestMatch.external_urls.spotify;
      } else {
        console.warn(
          `⚠️ No good match found for ${title} - ${artist} on Spotify.`
        );
        return null;
      }
    }

    console.warn(`⚠️ No Spotify results found for ${title} - ${artist}.`);
    return null;
  } catch (error) {
    console.error(
      `❌ Error searching Spotify for ${title} - ${artist} - ${album}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * ✅ Get or Fetch Spotify URL for a song
 * @param {string} title
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<string|null>} Spotify URL or null if not found
 */
async function fetchSpotifyUrl(title, artist, album) {
  const cacheKey = `spotify_${title}_${artist}_${album}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`✅ Loaded Spotify URL from cache for ${title} - ${artist}`);
    return cachedData;
  }

  const client = await pool.connect();

  try {
    // ✅ Check database first
    const result = await client.query(
      `SELECT spotify_url FROM songs 
       WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2 LIMIT 1)`,
      [title, artist]
    );

    if (result.rows.length > 0) {
      const { spotify_url } = result.rows[0];

      if (spotify_url) {
        console.log(`✅ Using existing Spotify URL for ${title} - ${artist}`);
        setCache(cacheKey, spotify_url);
        return spotify_url;
      }
    }

    // ✅ Fetch from Spotify API if missing
    const spotifyUrl = await fetchFromSpotify(title, artist, album);
    if (!spotifyUrl) return null;

    // ✅ Store in database
    await client.query(
      `UPDATE songs SET spotify_url = $1 
       WHERE title = $2 AND artist_id = (SELECT id FROM artists WHERE name = $3 LIMIT 1)`,
      [spotifyUrl, title, artist]
    );

    // ✅ Store in cache
    setCache(cacheKey, spotifyUrl);
    console.log(`✅ Spotify URL saved: ${spotifyUrl}`);

    return spotifyUrl;
  } catch (error) {
    console.error(
      `❌ Error fetching Spotify URL for ${title} - ${artist}:`,
      error
    );
    return null;
  } finally {
    client.release();
  }
}

module.exports = { fetchSpotifyUrl };
