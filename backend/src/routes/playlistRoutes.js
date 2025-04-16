const express = require("express");
const verifySupabaseUser = require("../middlewares/verifySupabaseUser");
const {
  getUserPlaylistsWithSongs,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
  reorderPlaylistSongs
} = require("../services/playlistService");

const router = express.Router();
router.use(verifySupabaseUser);

/**
 * ✅ Get all playlists for a user with songs
 */
router.get("/", async (req, res) => {
  const userId = req.authenticatedUserId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }

  try {
    // Use the new function that returns playlists with songs already embedded
    const playlists = await getUserPlaylistsWithSongs(userId);
    res.json(playlists);
  } catch (error) {
    console.error("❌ Error fetching playlists:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Create a Playlist
 */
router.post("/create", async (req, res) => {
  console.log("📥 Incoming request to /create:", req.body);

  const userId = req.authenticatedUserId;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Invalid playlist name." });
  }

  try {
    const playlist = await createPlaylist(userId, name);
    res.json(playlist);
  } catch (error) {
    console.error("❌ Error creating playlist:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Add a Song to a Playlist
 */
router.post("/add-song", async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    const { playlistId, songId } = req.body;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: "Missing playlistId or songId" });
    }

    const response = await addSongToPlaylist(playlistId, songId, userId);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✅ Remove a Song from a Playlist
 */
router.post("/remove-song", async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    const { playlistId, songId } = req.body;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: "Missing playlistId or songId" });
    }

    const response = await removeSongFromPlaylist(playlistId, songId, userId);

    res.json(response);
  } catch (error) {
    console.error("❌ Error removing song:", error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✅ Rename a Playlist
 */
router.post("/rename", async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    const { playlistId, newName } = req.body;

    const response = await renamePlaylist(playlistId, newName, userId);

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✅ Delete a Playlist
 */
router.delete("/delete", async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    const { playlistId } = req.body;

    const response = await deletePlaylist(playlistId, userId);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✅ Reorder a Playlist
 */
router.post("/reorder", async (req, res) => {
  try {
    const userId = req.authenticatedUserId;
    const { playlistId, songIds } = req.body;

    if (!playlistId || !Array.isArray(songIds)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const response = await reorderPlaylistSongs(playlistId, songIds, userId);
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Error in reorder route:", err);
    res.status(500).json({ error: err.message || "Failed to reorder songs" });
  }
});

module.exports = router;
