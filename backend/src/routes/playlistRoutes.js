const express = require("express");
const {  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
} = require("../services/playlistService");

const router = express.Router();

/**
 * ✅ Create a Playlist
 */
router.post("/create", async (req, res) => {
  try {
    const { userId, name } = req.body;
    const playlist = await createPlaylist(userId, name);
    res.json(playlist);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const response = await removeSongFromPlaylist(playlistId, songId);
    res.json(response);
  } catch (error) {
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
