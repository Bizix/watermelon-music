const axios = require("axios");
const pool = require("../config/db");
const { generateSearchQueries } = require("../utils/queryUtils");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

let spotifyAccessToken = null;
let tokenExpirationTime = 0;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  throw new Error("Missing Spotify client credentials in environment variables.");
}

// 🎫 Client Credentials Flow — used for public data (e.g. searching tracks)
async function getSpotifyAccessToken() {
  if (spotifyAccessToken && Date.now() < tokenExpirationTime) {
    return spotifyAccessToken;
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
    tokenExpirationTime = Date.now() + response.data.expires_in * 1000;
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

// Handles exchange of code → access_token (used in /callback)
async function exchangeSpotifyCodeForToken(code, redirectUri) {
  try {
    const response = await axios.post(
      SPOTIFY_AUTH_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (err) {
    console.error("❌ Failed to exchange code:", err.response?.data || err.message);
    throw err;
  }
}

async function fetchFromSpotify(title, artist, album) {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) return null;

    // Generate multiple search queries based on the artist and title
    const queries = generateSearchQueries(artist, title, album);

    let tracks = [];
    for (const query of queries) {
      console.log(`🔎 Searching Spotify with query: ${query}`);
      const response = await axios.get(SPOTIFY_SEARCH_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: "track",
          limit: 5,
        },
      });

      tracks = response.data.tracks.items;
      if (tracks && tracks.length > 0) {
        console.log(
          `🎵 Found ${tracks.length} results for query: ${query}`
        );
        break;
      } else {
        console.warn(`⚠️ No results for query: ${query}`);
      }
    }

    if (tracks && tracks.length > 0) {
      // Prefer non-instrumental/karaoke tracks
      let selectedTrack = tracks[0];
      for (const track of tracks) {
        if (!/\b(instrumental|karaoke)\b/i.test(track.name)) {
          selectedTrack = track;
          break;
        }
      }
      console.log(
        `✅ Selected: ${selectedTrack.name} by ${selectedTrack.artists
          .map((a) => a.name)
          .join(", ")}`
      );
      return selectedTrack.id;
    }

    console.warn(
      `⚠️ No suitable match found for "${title}" - "${artist}" on Spotify.`
    );
    return null;
  } catch (error) {
    console.error(
      `❌ Error searching Spotify for "${title}" - "${artist}" - "${album}":`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function fetchSpotifyUrl(title, artist, album) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT spotify_url FROM songs 
       WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2 LIMIT 1)`,
      [title, artist]
    );
    if (result.rows.length > 0) {
      const { spotify_url } = result.rows[0];
      if (spotify_url) {
        console.log(`✅ Using existing Spotify URL for "${title}" - "${artist}"`);
        return spotify_url;
      }
    }
    const spotifyUrl = await fetchFromSpotify(title, artist, album);
    if (!spotifyUrl) return null;
    await client.query(
      `UPDATE songs SET spotify_url = $1 
       WHERE title = $2 AND artist_id = (SELECT id FROM artists WHERE name = $3 LIMIT 1)`,
      [spotifyUrl, title, artist]
    );
    return spotifyUrl;
  } catch (error) {
    console.error(
      `❌ Error fetching Spotify URL for "${title}" - "${artist}":`,
      error
    );
    return null;
  } finally {
    client.release();
  }
}

module.exports = { fetchFromSpotify, fetchSpotifyUrl, exchangeSpotifyCodeForToken };
