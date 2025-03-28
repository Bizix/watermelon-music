const express = require("express");
const {  getUserPlaylistsWithSongs,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
} = require("../services/playlistService");

const router = express.Router();

/**
 * ✅ Get all playlists for a user with songs
 */
router.get("/", async (req, res) => {
  const { userId } = req.query;

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

  const { userId, name } = req.body;

  if (!userId || !name || !name.trim()) {
    console.log("❌ Invalid data received:", { userId, name });
    return res.status(400).json({ error: "Invalid data." });
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
    const { playlistId, songId, userId } = req.body;

    if (!playlistId || !songId || !userId) {
      console.error("❌ Missing parameters:", { playlistId, songId, userId });
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
    const { playlistId, songId, userId } = req.body;

    if (!playlistId || !songId || !userId) {
      console.error("❌ Missing parameters:", { playlistId, songId, userId });
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
    const { playlistId, newName } = req.body;
    const response = await renamePlaylist(playlistId, newName);
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
    const { playlistId } = req.body;
    const response = await deletePlaylist(playlistId);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
