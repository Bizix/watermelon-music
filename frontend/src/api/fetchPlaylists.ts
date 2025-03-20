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
    const response = await axios.get<Playlist[]>(`${API_BASE_URL}/api/playlistRoutes`, {
      params: { userId },
    });

    // ✅ Ensure `songs` always exists as an array
    const playlists = await Promise.all(
      response.data.map(async (playlist) => {
        try {
          const songsResponse = await axios.get<string[]>(`${API_BASE_URL}/api/playlistRoutes/songs`, {
            params: { playlistId: playlist.id },
          });

          return {
            ...playlist,
            songs: songsResponse.data || [], // ✅ Ensure `songs` is always an array
          };
        } catch (error) {
          console.error(`❌ Error fetching songs for playlist ${playlist.id}:`, error);
          return { ...playlist, songs: [] }; // ✅ Fallback to an empty array
        }
      })
    );
    
    return playlists;
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return [];
  }
}