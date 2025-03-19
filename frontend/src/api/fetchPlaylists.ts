import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ Ensure this is set in your .env file

export async function fetchPlaylists(userId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/playlistRoutes`, {
      params: { userId }, // ✅ Pass userId as a query parameter
    });
    return response.data; // Return playlists array
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return []; // Return an empty array if an error occurs
  }
}
