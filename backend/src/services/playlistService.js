const { supabase } = require("../config/supabaseAdmin");

/**
 * ✅ Create a new playlist
 */
async function createPlaylist(userId, name) {
  if (!userId || !name.trim()) {
    throw new Error("Invalid data.");
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert([{ user_id: userId, name: name.trim() }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * ✅ Add a song to a playlist
 */
async function addSongToPlaylist(playlistId, songId) {
  const { error } = await supabase
    .from("playlist_songs")
    .insert([{ playlist_id: playlistId, song_id: songId }]);

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Song added successfully." };
}

/**
 * ✅ Remove a song from a playlist
 */
async function removeSongFromPlaylist(playlistId, songId) {
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Song removed successfully." };
}

/**
 * ✅ Rename a playlist
 */
async function renamePlaylist(playlistId, newName) {
  const { error } = await supabase
    .from("playlists")
    .update({ name: newName })
    .eq("id", playlistId);

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Playlist renamed successfully." };
}

/**
 * ✅ Delete a playlist
 */
async function deletePlaylist(playlistId) {
  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId);

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Playlist deleted successfully." };
}

// ✅ Export service functions
module.exports = {
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
};
