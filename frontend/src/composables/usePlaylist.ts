import { ref } from "vue";
import { API_BASE_URL } from "../config";

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

  // ✅ Fetch all playlists for a user
  async function fetchPlaylists(userId: string): Promise<void> {
    if (!userId) return;
    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch(`/api/playlistRoutes?userId=${userId}`);
      const result: Playlist[] = await response.json();

      if (!response.ok) {
        errorMessage.value = result ? (result as any).error || "Failed to fetch playlists." : "Failed to fetch playlists.";
        return;
      }

      playlists.value = result || [];
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

      // ✅ Optimistically add playlist to UI before API call
      const tempPlaylist: Playlist = { id: "temp-" + Date.now(), name, userId, songs: [] };
      playlists.value.push(tempPlaylist);

      try {
        const response = await fetch(`${API_BASE_URL}/api/playlistRoutes/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, name }),
        });

        const result: Playlist = await response.json();

        if (!response.ok || (result as { error?: string }).error) {
          errorMessage.value = (result as { error?: string }).error || "Failed to create playlist."; // ❌ Rollback UI if API fails
          playlists.value = playlists.value.filter(p => p.id !== tempPlaylist.id);
          return;
        }

        // ✅ Replace tempPlaylist with actual one from API
        playlists.value = playlists.value.map(p => 
          p.id === tempPlaylist.id ? result : p
        );

        return result;
      } catch (error) {
        console.error("❌ Error creating playlist:", error);
        errorMessage.value = "An error occurred while creating the playlist.";

        // ❌ Rollback UI if error occurs
        playlists.value = playlists.value.filter(p => p.id !== tempPlaylist.id);
      } finally {
        isLoading.value = false;
      }
    }


  // ✅ Add a song to a playlist
  async function addToPlaylist(playlistId: string, songId: string): Promise<boolean | void> {
    if (!playlistId || !songId) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch("/api/playlistRoutes/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, songId }),
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
  async function removeFromPlaylist(playlistId: string, songId: string): Promise<boolean | void> {
    if (!playlistId || !songId) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch("/api/playlistRoutes/remove-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, songId }),
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
    playlists,
    isLoading,
    errorMessage,
    fetchPlaylists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };
}
