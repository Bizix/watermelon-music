import { ref } from "vue";
import { API_BASE_URL } from "../config";
import { fetchPlaylists } from "../api/fetchPlaylists";

interface Playlist {
  id: string;
  name: string;
  userId: string;
  songs: string[];
}

export function usePlaylist() {
  const playlists = ref<Playlist[]>([]);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string>("");

  // ✅ Fetch and update playlists state using the external API function
  async function loadPlaylists(userId: string) {
    if (!userId) return;
    isLoading.value = true;
    errorMessage.value = "";

    try {
      playlists.value = await fetchPlaylists(userId); // ✅ Uses fetchPlaylists from api/
    } catch (error) {
      errorMessage.value = "An error occurred while fetching playlists.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Create a new playlist
  async function createPlaylist(userId: string, name: string): Promise<Playlist | void> {
    if (!userId || !name.trim()) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/playlistRoutes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });

      const result: Playlist = await response.json();

      if (!response.ok || (result as { error?: string }).error) {
        errorMessage.value = (result as { error?: string }).error || "Failed to create playlist.";
        return;
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating playlist:", error);
      errorMessage.value = "An error occurred while creating the playlist.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Add a song to a playlist
  async function addToPlaylist(playlistId: string, songId: string,  userId: string): Promise<boolean | void> {    
    if (!playlistId || !songId || !userId) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/playlistRoutes/add-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, songId, userId }),
      });

      if (!response.ok) {
        errorMessage.value = "Error adding song to playlist.";
        return;
      }

      return true;
    } catch (error) {
      errorMessage.value = "An error occurred while adding the song.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Remove a song from a playlist
  async function removeFromPlaylist(playlistId: string, songId: string, userId: string): Promise<boolean | void> {
    if (!playlistId || !songId || !userId) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/playlistRoutes/remove-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, songId,  userId }),
      });

      if (!response.ok) {
        errorMessage.value = "Error removing song from playlist.";
        return;
      }

      return true;
    } catch (error) {
      errorMessage.value = "An error occurred while removing the song.";
    } finally {
      isLoading.value = false;
    }
  }

  return {
    loadPlaylists, // ✅ Now the only function responsible for fetching playlists
    isLoading,
    errorMessage,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };
}
