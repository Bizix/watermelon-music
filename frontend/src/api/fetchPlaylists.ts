import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ Ensure this is set in your .env file

// ✅ Define a type for Playlist
interface Playlist {
  id: string;
  userId: string;
  name: string;
  created_at: string;
  songs: string[]; // ✅ Ensure `songs` is an array
}

export async function fetchPlaylists(userId: string): Promise<Playlist[]> {
  try {
    const response = await axios.get<Playlist[]>(`${API_BASE_URL}/api/playlistRoutes`, {
      params: { userId }, // ✅ Pass userId as a query parameter
    });

    // ✅ Ensure `songs` always exists as an array
    const playlists = response.data.map((playlist: Playlist) => ({
      ...playlist,
      songs: Array.isArray(playlist.songs) ? playlist.songs : [], // ✅ Prevents undefined errors
    }));

    console.log("✅ Playlists fetched:", playlists);
    return playlists;
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return []; // Return an empty array if an error occurs
  }
}