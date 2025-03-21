const { supabaseAdmin } = require("../config/supabaseAdmin");
const { getCache, setCache } = require("../services/cacheService");


/**
 * ✅ Fetch playlists for a user (Checks Cache)
 */
async function getUserPlaylists(userId) {
  const cacheKey = `playlists_${userId}`;
  const cachedPlaylists = getCache(cacheKey);

  if (cachedPlaylists) {
    console.log(`✅ Using cached playlists for user ${userId}`);
    return cachedPlaylists;
  }

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

  const formattedPlaylists = playlists.map(playlist => ({
    ...playlist,
    songs: playlist.playlist_songs
      ? playlist.playlist_songs.map(song => ({
          id: song.songs.id,  // ✅ Get song ID from `songs` table
          title: song.songs.title // ✅ Get song title
        }))
      : [],
  }));

  setCache(cacheKey, formattedPlaylists); // ✅ Cache playlists
  return formattedPlaylists;
}

/**
 * ✅ Fetch all songs for a given playlist (Checks Cache)
 */
async function getPlaylistSongs(playlistId) {
  const cacheKey = `playlist_songs_${playlistId}`;
  const cachedSongs = getCache(cacheKey);

  if (cachedSongs) {
    console.log(`✅ Using cached songs for playlist ${playlistId}`);
    return cachedSongs;
  }

  // console.log(`📥 Fetching songs for playlist ${playlistId}`);

  const { data, error } = await supabaseAdmin
    .from("playlist_songs")
    .select("song_id")
    .eq("playlist_id", playlistId);

  if (error) {
    console.error("❌ Supabase Fetch Error:", error.message);
    throw new Error(error.message);
  }

  const songIds = data.map(entry => entry.song_id);
  setCache(cacheKey, songIds); // ✅ Cache playlist songs
  return songIds;
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

  // ✅ Invalidate cache for playlist & user's playlists
  setCache(`playlist_songs_${playlistId}`, null);
  setCache(`playlists_${data[0].user_id}`, null); // Ensure user cache is updated

  return { data };
}

/**
 * ✅ Remove a song from a playlist (Invalidates Cache)
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
    console.error("❌ Song not found in playlist.");
    return { error: "Song not found in playlist" };
  }

  console.log("✅ Song removed successfully:", data);

  // ✅ Invalidate cache for playlist & user's playlists
  setCache(`playlist_songs_${playlistId}`, null);
  setCache(`playlists_${data[0].user_id}`, null);

  return { data };
}

/**
 * ✅ Rename a playlist (Invalidates Cache)
 */
async function renamePlaylist(playlistId, newName) {
  const { error } = await supabaseAdmin
    .from("playlists")
    .update({ name: newName })
    .eq("id", playlistId);

  if (error) {
    throw new Error(error.message);
  }

  console.log("✅ Playlist renamed successfully.");

  // ✅ Invalidate cache for user's playlists
  setCache(`playlists_${playlistId}`, null);

  return { message: "Playlist renamed successfully." };
}

/**
 * ✅ Delete a playlist (Invalidates Cache)
 */
async function deletePlaylist(playlistId) {
  const { data, error } = await supabaseAdmin
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.length) {
    return { error: "Playlist not found." };
  }

  console.log("✅ Playlist deleted successfully.");

  // ✅ Invalidate cache for user's playlists
  setCache(`playlists_${data[0].user_id}`, null);
  setCache(`playlist_songs_${playlistId}`, null);

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
