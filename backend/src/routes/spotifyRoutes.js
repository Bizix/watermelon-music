const express = require("express");
const router = express.Router();
const {
  exchangeSpotifyCodeForToken,
  exportPlaylistToSpotify,
  refreshSpotifyToken
} = require("../api/spotifyService");
const { supabaseAdmin } = require("../config/supabaseAdmin");
const verifySupabaseUser = require("../middlewares/verifySupabaseUser");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SCOPE = "playlist-modify-public playlist-modify-private user-read-email";

// ✅ Spotify login
router.get("/login", (req, res) => {
  const state = JSON.stringify({
    from: req.query.from || "/",
    user_id: req.query.user_id || null,
  });

  const authURL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPE)}&state=${encodeURIComponent(state)}`;

  res.redirect(authURL);
});

// ✅ Spotify callback
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    const parsedState = JSON.parse(decodeURIComponent(state || "%7B%7D"));
    const from =
      parsedState.from && parsedState.from.startsWith("/")
        ? parsedState.from
        : "/";
    const user_id = parsedState.user_id;

    if (!user_id) return res.status(400).send("Missing user_id in state");

    const { accessToken, refreshToken, expiresIn } =
      await exchangeSpotifyCodeForToken(code, REDIRECT_URI);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const { data: upsertResult, error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: user_id,
        spotify_access_token: accessToken,
        spotify_refresh_token: refreshToken,
        spotify_expires_at: expiresAt,
        is_spotify_connected: true,
      })
      .select();

    if (upsertError) {
      console.error("❌ Failed to upsert user:", upsertError);
      throw upsertError;
    }

    console.log("✅ Upserted user:", upsertResult);

    const redirectUrl = `${process.env.FRONTEND_URL}${from}?spotify=connected`;
    console.log("🔁 Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Spotify callback error:", err);
    res.status(500).send("Failed to authenticate with Spotify");
  }
});

router.post("/export-playlist", verifySupabaseUser, async (req, res) => {
  const userId = req.authenticatedUserId;
  const { playlistId } = req.body;

  if (!playlistId || !userId) {
    return res
      .status(400)
      .json({ error: "Missing playlistId or user not authenticated" });
  }

  try {
    // 🔑 Get user's tokens
    const { data: userRow, error } = await supabaseAdmin
      .from("users")
      .select("spotify_access_token, spotify_refresh_token, spotify_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !userRow) {
      return res.status(401).json({ error: "User or token not found" });
    }

    const {
      spotify_access_token,
      spotify_refresh_token,
      spotify_expires_at,
    } = userRow;

    // ⏱ Check if access token is expired
    const now = Math.floor(Date.now() / 1000);
    let accessToken = spotify_access_token;

    if (!accessToken || (spotify_expires_at && spotify_expires_at < now + 60)) {
      console.log("♻️ Refreshing Spotify access token...");

      const refreshed = await refreshSpotifyToken(spotify_refresh_token);
      if (!refreshed?.access_token) {
        return res.status(401).json({ error: "Failed to refresh Spotify token" });
      }

      accessToken = refreshed.access_token;

      // 📝 Update in Supabase
      await supabaseAdmin
        .from("users")
        .update({
          spotify_access_token: refreshed.access_token,
          spotify_expires_at: now + refreshed.expires_in,
        })
        .eq("id", userId);
    }

    // 🚀 Export using fresh token
    const result = await exportPlaylistToSpotify(userId, playlistId, accessToken);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({
      success: true,
      spotifyPlaylistId: result.spotifyPlaylistId,
      playlistUrl: result.playlistUrl,
    });
  } catch (err) {
    console.error("❌ Error exporting playlist:", err.message);
    res.status(500).json({ error: "Server error while exporting playlist" });
  }
});

module.exports = router;
