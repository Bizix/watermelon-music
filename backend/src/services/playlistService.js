const { supabaseAdmin } = require("../config/supabaseAdmin");

/**
 * ✅ Fetch playlists for a user
 */
async function getUserPlaylists(userId) {
  const { data: playlists, error } = await supabaseAdmin
    .from("playlists")
    .select(`
      id, 
      user_id, 
      name, 
      created_at, 
      playlist_songs (song_id, songs (id, title))
    `) // ✅ Correctly join `playlist_songs` with `songs`
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase Error:", error);
    throw new Error(error.message);
  }

  return playlists.map(playlist => ({
    ...playlist,
    songs: playlist.playlist_songs 
      ? playlist.playlist_songs.map(song => ({
          id: song.songs.id,  // ✅ Get song ID from `songs` table
          title: song.songs.title // ✅ Get song title
        }))
      : [],
  }));
}

/**
 * ✅ Fetch all songs for a given playlist
 */
async function getPlaylistSongs(playlistId) {
  console.log(`📥 Fetching songs for playlist ${playlistId}`);

  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .select("song_id")
    .eq("playlist_id", playlistId);

  if (error) {
    console.error("❌ Supabase Fetch Error:", error.message);
    throw new Error(error.message);
  }

  return data.map(entry => entry.song_id); // ✅ Return only song IDs
}

/**
 * ✅ Create a new playlist
 */
async function createPlaylist(userId, name) {
  try {
    console.log("📌 Creating playlist for:", { userId, name });

    // ✅ Check if a playlist with the same name already exists
    const { data: existingPlaylists } = await supabaseAdmin
      .from("playlists")
      .select("name")
      .eq("user_id", userId);

    let newName = name.trim();
    let count = 1;

    while (existingPlaylists.some(p => p.name === newName)) {
      newName = `${name.trim()} (${count++})`;
    }

    const { data, error } = await supabaseAdmin
      .from("playlists")
      .insert([{ user_id: userId, name: newName }])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      throw new Error(error.message);
    }

    console.log("✅ Playlist created:", data);
    return data;
  } catch (err) {
    console.error("❌ Unexpected Error in createPlaylist:", err.message);
    throw err;
  }
}


/**
 * ✅ Add a song to a playlist
 */
async function addSongToPlaylist(playlistId, songId) {
  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .insert([{ playlist_id: playlistId, song_id: songId }])
    .select("*");

  if (error) {
    console.error("❌ Supabase Insert Error:", error);
    return { error };
  }

  console.log("✅ Song added successfully:", data);
  return { data };
}

/**
 * ✅ Remove a song from a playlist
 */
async function removeSongFromPlaylist(playlistId, songId) {
  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId)
    .select();

  if (error) {
    console.error("❌ Supabase Delete Error:", error);
    throw new Error(error.message);
  }

  if (data.length === 0) {
    console.error("❌ Supabase Insert Error:", error);
    return { error };
  } 

  console.log("✅ Song removed successfully:", data);
  return { data };
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
  getUserPlaylists,
  getPlaylistSongs,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
};
