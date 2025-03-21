import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ Ensure this is set in your .env file

// ✅ Define a type for Playlist
interface Playlist {
  id: string;
  userId: string;
  name: string;
  created_at: string;
  songs: string[];
}

export async function fetchPlaylists(userId: string): Promise<Playlist[]> {
  try {
    const response = await axios.get<Playlist[]>(
      `${API_BASE_URL}/api/playlistRoutes`,
      {
        params: { userId },
      }
    );
    // Ensure each playlist has a songs array
    return response.data.map((playlist) => ({
      ...playlist,
      songs: playlist.songs || [],
    }));
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return [];
  }
}
