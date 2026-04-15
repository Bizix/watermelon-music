import { ref } from "vue";
import {
  addSongToPlaylistRecord,
  createPlaylistRecord,
  deletePlaylistRecord,
  fetchPlaylistSummaries,
  removeSongFromPlaylistRecord,
  renamePlaylistRecord,
  reorderPlaylistSongRecords,
} from "@/api/playlistStore";

interface Playlist {
  id: number;
  name: string;
  userId: string;
  songs: number[];
}

export function usePlaylist() {
  const playlists = ref<Playlist[]>([]);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string>("");

  function setErrorMessage(error: unknown, fallbackMessage: string) {
    errorMessage.value =
      error instanceof Error && error.message ? error.message : fallbackMessage;
  }

  async function runPlaylistRequest<T>(
    operation: () => Promise<T>,
    fallbackMessage: string
  ): Promise<T | null> {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      return await operation();
    } catch (error) {
      setErrorMessage(error, fallbackMessage);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Fetch and update playlists state using the external API function
  async function loadPlaylists() {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      playlists.value = await fetchPlaylistSummaries();
    } catch (error) {
      errorMessage.value = "An error occurred while fetching playlists.";
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Create a new playlist
  async function createPlaylist(name: string): Promise<Playlist | null> {
    if (!name.trim()) return null;

    return runPlaylistRequest<Playlist>(
      () => createPlaylistRecord(name),
      "An error occurred while creating the playlist."
    );
  }

  // ✅ Add a song to a playlist
  async function addToPlaylist(
    playlistId: number,
    songId: number
  ): Promise<boolean> {
    if (!playlistId || !songId) return false;

    const result = await runPlaylistRequest(
      () => addSongToPlaylistRecord(playlistId, songId),
      "An error occurred while adding the song."
    );

    return result !== null;
  }

  // ✅ Remove a song from a playlist
  async function removeFromPlaylist(
    playlistId: number,
    songId: number
  ): Promise<boolean> {
    if (!playlistId || !songId) return false;

    const result = await runPlaylistRequest(
      () => removeSongFromPlaylistRecord(playlistId, songId),
      "An error occurred while removing the song."
    );

    return result !== null;
  }

  async function deletePlaylist(playlistId: number): Promise<boolean> {
    if (!playlistId) return false;

    const result = await runPlaylistRequest(
      () => deletePlaylistRecord(playlistId),
      "An error occurred while deleting the playlist."
    );

    return result !== null;
  }

  async function renamePlaylist(playlistId: number, newName: string): Promise<boolean> {
    if (!playlistId || !newName.trim()) return false;

    const result = await runPlaylistRequest(
      () => renamePlaylistRecord(playlistId, newName),
      "An error occurred while renaming the playlist."
    );

    return result !== null;
  }

  async function reorderPlaylistSongs(
    playlistId: number,
    songIds: number[]
  ): Promise<boolean> {
    if (!playlistId || !Array.isArray(songIds)) return false;

    const result = await runPlaylistRequest(
      () => reorderPlaylistSongRecords(playlistId, songIds),
      "An error occurred while reordering songs."
    );

    return result !== null;
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
