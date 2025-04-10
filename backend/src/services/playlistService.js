const { supabaseAdmin } = require("../config/supabaseAdmin");
const { getCache, setCache, removeCache } = require("../services/cacheService");

async function getUserPlaylistsWithSongs(userId) {
  const cacheKey = `playlists_${userId}`;
  const cachedPlaylists = getCache(cacheKey);
  if (cachedPlaylists) {
    return cachedPlaylists;
  }

  const { data, error } = await supabaseAdmin
    .from("playlists")
    .select(
      `
    id,
    user_id,
    name,
    created_at,
    playlist_songs ( song_id )
  `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase Fetch Error:", error.message);
    throw new Error(error.message);
  }

  // // Transform the data if necessary so that each playlist has a simple array of song IDs.
  const playlists = data.map((playlist) => ({
    id: playlist.id,
    userId: playlist.user_id,
    name: playlist.name,
    created_at: playlist.created_at,
    // Extract song_id from the nested playlist_songs array
    songs: playlist.playlist_songs
      ? playlist.playlist_songs.map((song) => song.song_id)
      : [],
  }));

  // console.log(playlists);

  setCache(cacheKey, playlists);

  return playlists;
}

/**
 * ✅ Create a new playlist (Invalidates Cache)
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

    while (existingPlaylists.some((p) => p.name === newName)) {
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

    // ✅ Invalidate cache for user’s playlists
    setCache(`playlists_${userId}`, null);

    return data;
  } catch (err) {
    console.error("❌ Unexpected Error in createPlaylist:", err.message);
    throw err;
  }
}

/**
 * ✅ Add a song to a playlist (Invalidates Cache)
 */
async function addSongToPlaylist(playlistId, songId, userId) {
  // ✅ Confirm playlist ownership
  const { data: playlist, error: fetchError } = await supabaseAdmin
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();

  if (fetchError || !playlist || playlist.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this playlist");
  }

  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .insert([{ playlist_id: playlistId, song_id: songId }])
    .select("*");

  if (error) {
    console.error("❌ Supabase Insert Error:", error);
    return { error };
  }

  console.log("✅ Song added successfully:", data);
  removeCache(`playlists_${userId}`);

  return { data };
}

/**
 * ✅ Remove a song from a playlist (Invalidates Cache)
 */
async function removeSongFromPlaylist(playlistId, songId, userId) {
  // ✅ Confirm playlist ownership
  const { data: playlist, error: fetchError } = await supabaseAdmin
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();

  if (fetchError || !playlist || playlist.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this playlist");
  }

  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId)
    .select();

  if (error) throw new Error(error.message);

  if (data.length === 0) {
    return { error: "Song not found in playlist" };
  }

  console.log("✅ Song removed successfully:", data);
  removeCache(`playlists_${userId}`);

  return { data };
}

/**
 * ✅ Rename a playlist (Invalidates Cache)
 */
async function renamePlaylist(playlistId, newName, userId) {
  // ✅ Ensure the playlist belongs to the user
  const { data: playlist, error: fetchError } = await supabaseAdmin
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();

  if (fetchError || !playlist || playlist.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this playlist");
  }

  const { error } = await supabaseAdmin
    .from("playlists")
    .update({ name: newName })
    .eq("id", playlistId);

  if (error) throw new Error(error.message);

  console.log("✅ Playlist renamed successfully.");
  setCache(`playlists_${userId}`, null);

  return { message: "Playlist renamed successfully." };
}

/**
 * ✅ Delete a playlist (Invalidates Cache)
 */
async function deletePlaylist(playlistId, userId) {
  // ✅ Confirm ownership first
  const { data: playlist, error: fetchError } = await supabaseAdmin
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();

  if (fetchError || !playlist || playlist.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this playlist");
  }

  const { error } = await supabaseAdmin
    .from("playlists")
    .delete()
    .eq("id", playlistId);

  if (error) throw new Error(error.message);

  console.log("✅ Playlist deleted successfully.");
  setCache(`playlists_${userId}`, null);
  setCache(`playlist_songs_${playlistId}`, null);

  return { message: "Playlist deleted successfully." };
}
// ✅ Export service functions
module.exports = {
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  deletePlaylist,
  getUserPlaylistsWithSongs,
};
