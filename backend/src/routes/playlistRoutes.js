const express = require("express");
const {  getUserPlaylists,
  getPlaylistSongs,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
} = require("../services/playlistService");

const router = express.Router();



/**
 * ✅ Get all playlists for a user
 */
router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }

  try {
    const playlists = await getUserPlaylists(userId);
    res.json(playlists);
  } catch (error) {
    console.error("❌ Error fetching playlists:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Get all songs for a user's playlist
 */
router.get("/songs", async (req, res) => {
  const { playlistId } = req.query;

  if (!playlistId) {
    return res.status(400).json({ error: "Missing playlistId" });
  }

  try {
    const songs = await getPlaylistSongs(playlistId);
    res.json(songs);
  } catch (error) {
    console.error("❌ Error fetching playlist songs:", error.message);
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
    const { playlistId, songId } = req.body;
    const response = await addSongToPlaylist(playlistId, songId);
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
    const { playlistId, songId } = req.body;

    if (!playlistId || !songId) {
      console.error("❌ Missing parameters:", { playlistId, songId });
      return res.status(400).json({ error: "Missing playlistId or songId" });
    }
    
    const response = await removeSongFromPlaylist(playlistId, songId);
    
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
