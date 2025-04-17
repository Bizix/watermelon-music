const express = require("express");
const router = express.Router();
const { exchangeSpotifyCodeForToken } = require("../api/spotifyService");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SCOPE = "playlist-modify-public playlist-modify-private user-read-email";

// ✅ Spotify login
router.get("/login", (req, res) => {
  const from = req.query.from || "/"; // default to home
  const state = encodeURIComponent(from); // preserve original path

  const authURL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPE)}&state=${state}`;

  res.redirect(authURL);
});

// ✅ Spotify callback
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Missing Spotify code");
    }

    const { accessToken, refreshToken, expiresIn } =
      await exchangeSpotifyCodeForToken(code, REDIRECT_URI);

    console.log("✅ Access Token:", accessToken);
    console.log("✅ Refresh Token:", refreshToken);

    const redirectPath = decodeURIComponent(state || "/"); // fallback to root if no state
    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
  } catch (err) {
    console.error("❌ Spotify callback error:", err);
    res.status(500).send("Failed to authenticate with Spotify");
  }
});

module.exports = router;
