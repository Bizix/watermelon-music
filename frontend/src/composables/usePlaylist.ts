import { ref } from "vue";
import { API_BASE_URL } from "../config";
import { fetchPlaylists } from "../api/fetchPlaylists";
import { supabase } from "@/lib/supabaseClient";

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

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
      playlists.value = await fetchPlaylists(); // ✅ Uses fetchPlaylists from api/
    } catch (error) {
      errorMessage.value = "An error occurred while fetching playlists.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Create a new playlist
  async function createPlaylist(name: string): Promise<Playlist | void> {
    if (!name.trim()) return;

    isLoading.value = true;
    errorMessage.value = "";

    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      const result: Playlist = await response.json();

      if (!response.ok || (result as { error?: string }).error) {
        errorMessage.value =
          (result as { error?: string }).error || "Failed to create playlist.";
        return;
      }

      return result;
    } catch (error) {
      errorMessage.value = "An error occurred while creating the playlist.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Add a song to a playlist
  async function addToPlaylist(
    playlistId: string,
    songId: string
  ): Promise<boolean | void> {
    if (!playlistId || !songId) return;

    isLoading.value = true;
    errorMessage.value = "";

    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/add-song`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlistId, songId }),
        }
      );

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
  async function removeFromPlaylist(
    playlistId: string,
    songId: string
  ): Promise<boolean | void> {
    if (!playlistId || !songId) return;

    isLoading.value = true;
    errorMessage.value = "";

    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/remove-song`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlistId, songId }),
        }
      );

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

  async function deletePlaylist(playlistId: string): Promise<boolean | void> {
    if (!playlistId) return;

    isLoading.value = true;
    errorMessage.value = "";

    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlistId }),
        }
      );

      if (!response.ok) {
        errorMessage.value = "Failed to delete playlist.";
        return;
      }

      return true;
    } catch (error) {
      errorMessage.value = "An error occurred while deleting the playlist.";
    } finally {
      isLoading.value = false;
    }
  }

  async function renamePlaylist(playlistId: string, newName: string): Promise<boolean | void> {
    if (!playlistId || !newName.trim()) return;
  
    isLoading.value = true;
    errorMessage.value = "";
  
    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }
  
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/rename`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlistId, newName }),
        }
      );
  
      if (!response.ok) {
        errorMessage.value = "Failed to rename playlist.";
        return;
      }
  
      return true;
    } catch (error) {
      errorMessage.value = "An error occurred while renaming the playlist.";
    } finally {
      isLoading.value = false;
    }
  }

  async function reorderPlaylistSongs(
    playlistId: string,
    songIds: string[]
  ): Promise<boolean | void> {
    if (!playlistId || !Array.isArray(songIds)) return;
  
    isLoading.value = true;
    errorMessage.value = "";
  
    const token = await getAccessToken();
    if (!token) {
      errorMessage.value = "User not authenticated.";
      return;
    }
  
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlistRoutes/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlistId, songIds }),
        }
      );
  
      if (!response.ok) {
        errorMessage.value = "Failed to reorder songs.";
        return;
      }
  
      return true;
    } catch (error) {
      errorMessage.value = "An error occurred while reordering songs.";
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
    deletePlaylist,
    renamePlaylist,
    reorderPlaylistSongs,
  };
}
