const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");

// ✅ Create a Playlist
router.post("/create", async (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name.trim()) return res.status(400).json({ error: "Invalid data." });

  const { data, error } = await supabase
    .from("playlists")
    .insert([{ user_id: userId, name: name.trim() }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ✅ Add a Song to a Playlist
router.post("/add-song", async (req, res) => {
  const { playlistId, songId } = req.body;

  const { error } = await supabase
    .from("playlist_songs")
    .insert([{ playlist_id: playlistId, song_id: songId }]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Song added successfully." });
});

// ✅ Remove a Song from a Playlist
router.post("/remove-song", async (req, res) => {
  const { playlistId, songId } = req.body;

  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Song removed successfully." });
});

// ✅ Rename a Playlist
router.post("/rename", async (req, res) => {
  const { playlistId, newName } = req.body;

  const { error } = await supabase
    .from("playlists")
    .update({ name: newName })
    .eq("id", playlistId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Playlist renamed successfully." });
});

// ✅ Delete a Playlist
router.delete("/delete", async (req, res) => {
  const { playlistId } = req.body;

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Playlist deleted successfully." });
});

module.exports = router;
