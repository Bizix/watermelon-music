import { ref } from "vue";

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
      const response = await fetch(`/api/playlists?userId=${userId}`);
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

    try {
      const response = await fetch("/api/playlists/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });

      const result: Playlist = await response.json();

      if (!response.ok) {
        errorMessage.value = (result as any).error || "Failed to create playlist.";
        return;
      }

      playlists.value.push(result);
      return result;
    } catch (error) {
      errorMessage.value = "An error occurred while creating the playlist.";
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
      const response = await fetch("/api/playlists/add-song", {
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
      const response = await fetch("/api/playlists/remove-song", {
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
