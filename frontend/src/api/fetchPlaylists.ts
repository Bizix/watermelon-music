import { supabase } from "@/lib/supabaseClient";
import { API_BASE_URL } from "../config";

// ✅ Define a type for Playlist
interface Playlist {
  id: string;
  userId: string;
  name: string;
  created_at: string;
  songs: string[];
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  try {
    // 🔐 Get access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      console.error("❌ No Supabase token found");
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/playlistRoutes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("❌ Error fetching playlists:", err);
      return [];
    }

    const playlists: Playlist[] = await response.json();

    return playlists.map((playlist) => ({
      ...playlist,
      songs: playlist.songs || [],
    }));
  } catch (error) {
    console.error("❌ Error fetching playlists:", error);
    return [];
  }
}
