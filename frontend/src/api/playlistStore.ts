import { supabase } from "@/lib/supabaseClient";

export interface PlaylistSummary {
  id: number;
  userId: string;
  name: string;
  created_at: string;
  songs: number[];
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session?.user?.id ?? null;
}

async function getPlaylistSongIds(playlistIds: number[]) {
  if (playlistIds.length === 0) {
    return new Map<number, number[]>();
  }

  const { data, error } = await supabase
    .from("playlist_songs")
    .select("playlist_id, song_id, position")
    .in("playlist_id", playlistIds)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  const songsByPlaylist = new Map<number, number[]>();

  for (const entry of data || []) {
    const existing = songsByPlaylist.get(entry.playlist_id) || [];
    existing.push(entry.song_id);
    songsByPlaylist.set(entry.playlist_id, existing);
  }

  return songsByPlaylist;
}

async function getUniquePlaylistName(userId: string, name: string) {
  const trimmedName = name.trim();
  const { data, error } = await supabase
    .from("playlists")
    .select("name")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const existingNames = new Set((data || []).map((playlist) => playlist.name));
  let candidate = trimmedName;
  let count = 1;

  while (existingNames.has(candidate)) {
    candidate = `${trimmedName} (${count++})`;
  }

  return candidate;
}

export async function fetchPlaylistSummaries(): Promise<PlaylistSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("playlists")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const playlists = data || [];
  const songsByPlaylist = await getPlaylistSongIds(playlists.map((playlist) => playlist.id));

  return playlists.map((playlist) => ({
    id: playlist.id,
    userId: playlist.user_id,
    name: playlist.name,
    created_at: playlist.created_at,
    songs: songsByPlaylist.get(playlist.id) || [],
  }));
}

export async function createPlaylistRecord(name: string): Promise<PlaylistSummary> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const uniqueName = await getUniquePlaylistName(userId, name);
  const { data, error } = await supabase
    .from("playlists")
    .insert([{ user_id: userId, name: uniqueName }])
    .select("id, user_id, name, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    created_at: data.created_at,
    songs: [],
  };
}

export async function addSongToPlaylistRecord(playlistId: number, songId: number) {
  const { data: highestPositionRows, error: positionError } = await supabase
    .from("playlist_songs")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) {
    throw positionError;
  }

  const nextPosition =
    highestPositionRows && highestPositionRows.length > 0
      ? (highestPositionRows[0].position ?? 0) + 1
      : 0;

  const { error } = await supabase.from("playlist_songs").insert([
    {
      playlist_id: playlistId,
      song_id: songId,
      position: nextPosition,
    },
  ]);

  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function removeSongFromPlaylistRecord(playlistId: number, songId: number) {
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);

  if (error) {
    throw error;
  }
}

export async function renamePlaylistRecord(playlistId: number, newName: string) {
  const { error } = await supabase
    .from("playlists")
    .update({ name: newName.trim() })
    .eq("id", playlistId);

  if (error) {
    throw error;
  }
}

export async function deletePlaylistRecord(playlistId: number) {
  const { error } = await supabase.from("playlists").delete().eq("id", playlistId);

  if (error) {
    throw error;
  }
}

export async function reorderPlaylistSongRecords(
  playlistId: number,
  songIds: number[]
) {
  const rows = songIds.map((songId, index) => ({
    playlist_id: playlistId,
    song_id: songId,
    position: index,
  }));

  const { error } = await supabase
    .from("playlist_songs")
    .upsert(rows, { onConflict: "playlist_id,song_id" });

  if (error) {
    throw error;
  }
}
