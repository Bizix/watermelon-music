import { fetchPlaylistSummaries } from "@/api/playlistStore";

// ✅ Define a type for Playlist
interface Playlist {
  id: number;
  userId: string;
  name: string;
  created_at: string;
  songs: number[];
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  try {
    const playlists = await fetchPlaylistSummaries();

    return playlists.map((playlist) => ({
      ...playlist,
      songs: playlist.songs || [],
    }));
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return [];
  }
}
