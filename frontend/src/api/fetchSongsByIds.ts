// src/api/fetchSongsByPlaylistId.ts
import { supabase } from "@/lib/supabaseClient";

export async function fetchSongsByPlaylistId(playlistId: number) {
  if (!playlistId) return [];

  const { data, error } = await supabase
    .from("playlist_songs")
    .select("position, song:songs(*)")  // join songs
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (error) {
    console.error("❌ Failed to fetch songs for playlist:", error.message);
    throw new Error(error.message);
  }
  return data.map(entry => ({
    ...entry.song,
    _position: entry.position, // optional
  }));
}