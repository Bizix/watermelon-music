<!-- views/PlaylistsView.vue -->
<template>
  <!-- ✅ Playlist Control component -->
  <PlaylistControls
    :isSpotifyConnected="isSpotifyConnected"
     :selectedPlaylist="selectedPlaylist"
    v-model="filterQuery"
    @connectSpotify="handleConnectSpotify"
    @create="handleCreatePlaylist"
    @back="handleBack"
  />

    <LoadingSpinner
    v-if="creatingPlaylist"
    :isLoading="true"
    message="Creating playlist..."
    size="w-8 h-8"
    color="fill-green-500"
  />

    <!-- ✅ Scrollable Content -->
    <div
      v-if="!isLoading && !creatingPlaylist"
      ref="playlistScrollRef"
      class="overflow-y-auto flex-grow w-full scrollbar-hidden"
      @scroll="checkScroll"
    >
    <!-- ✅ If no playlist is selected, show list -->
    <template v-if="!selectedPlaylist">
      <div v-for="playlist in filteredPlaylists" :key="playlist.id">
        <!-- ✅ Show spinner if this playlist is being deleted -->
        <div v-if="deletingPlaylistId === playlist.id" class="w-full flex justify-center py-4">
          <LoadingSpinner :isLoading="true" message="Deleting..." size="w-8 h-8" color="fill-red-500" />
        </div>

        <!-- ✅ Otherwise show the playlist -->
        <PlaylistItem
          v-else
          :playlist="playlist"
          :isRenaming="renamingPlaylistId === playlist.id"
          @select="handleSelectPlaylist"
          @rename="handleRenamePlaylist"
          @delete="handleDeletePlaylist"
        />
      </div>
    </template>

    <!-- ✅ If a playlist is selected, show its songs -->
    <template v-else>
      <PlaylistSongCard
        v-for="song in selectedPlaylist.songs"
        :key="song.id"
        :song="song"
        :allPlaylists="playlists"
        :currentPlaylistId="String(selectedPlaylist.id)"
        :playlistName="selectedPlaylist.name"
        :removing="removingSongId === song.id"
        @removeSong="handleRemoveSong"
        @moveSongTo="handleMoveSongTo"
      />
    </template>
  </div>

  <!-- ✅ Loading Spinner -->
  <div v-else class="flex flex-grow items-center justify-center">
    <LoadingSpinner :isLoading="true" message="Loading playlists..." size="w-10 h-10" color="fill-green-500" />
  </div>

  <!-- ✅ Scroll Indicator -->
  <ScrollIndicator v-if="!isLoading" :showScrollIndicator="showScrollIndicator" />

  <!-- ✅ Modal Renderer -->
  <Modal
    v-if="activeModalComponent"
    :modalComponent="activeModalComponent"
    :props="activeModalProps"
    @close="activeModalComponent = null"
  />
</template>

<script>
import { ref, onMounted, watchEffect, nextTick, inject, computed, provide } from "vue";

import { fetchPlaylists } from "@/api/fetchPlaylists";
import { usePlaylist } from "@/composables/usePlaylist";
import { fetchSongsByIds } from "@/api/fetchSongsByIds";

import PlaylistControls from "@/components/PlaylistControls.vue";
import PlaylistItem from "@/components/PlaylistItem.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import PlaylistSongCard from "@/components/PlaylistSongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";
import Modal from "@/components/Modal.vue";


export default {
  components: {
    PlaylistControls,
    PlaylistItem,
    PlaylistSongCard,
    LoadingSpinner,
    ScrollIndicator,
    Modal,
  },

  setup() {
    const user = inject("user");
    const playlists = inject("playlists"); 
    const filterQuery = ref("");
    const selectedPlaylistId = ref(null);
    const selectedPlaylist = ref(null);
    const activeModalComponent = ref(null);
    const activeModalProps = ref({});
    const isLoading = ref(true);
    const playlistScrollRef = ref(null);
    const deletingPlaylistId = ref(null);
    const creatingPlaylist = ref(false);
    const renamingPlaylistId = ref(null);
    const removingSongId = ref(null);
    const isSpotifyConnected = ref(false); // This should be updated based on real auth check
    const { deletePlaylist, renamePlaylist, createPlaylist, addToPlaylist, removeFromPlaylist } = usePlaylist();

    const { showScrollIndicator, checkScroll } = useScrollIndicator(playlistScrollRef);

    async function fetchData() {
      isLoading.value = true;
      try {
        playlists.value = await fetchPlaylists();
        if (selectedPlaylistId.value) {
          selectedPlaylist.value = playlists.value.find(p => p.id === selectedPlaylistId.value) || null;
        }
      } catch (error) {
        console.error("❌ Error fetching playlists:", error);
      } finally {
        isLoading.value = false;
      }
    }

    
    const filteredPlaylists = computed(() => {
      const query = filterQuery.value.toLowerCase().trim();

      if (!query) return playlists.value;

      return playlists.value.filter(p => {
        const matchesName = p.name.toLowerCase().includes(query);
        // const matchesSongs = p.songs?.some(song =>
        //   song.title?.toLowerCase().includes(query) ||
        //   song.artist?.toLowerCase().includes(query)
        // );
        return matchesName
        //  || matchesSongs;
      });
    });


    async function handleSelectPlaylist(id) {
      selectedPlaylistId.value = id;
      const playlist = playlists.value.find(p => p.id === id);

      if (playlist) {
        try {
          const songIds = playlist.songs;

          const songs = await fetchSongsByIds(songIds);
          selectedPlaylist.value = {
            ...playlist,
            songs
          };

        } catch (err) {
          console.error("❌ Failed to load songs for playlist:", err);
        }
      }
}

    async function handleDeletePlaylist(id) {
      deletingPlaylistId.value = id;

      const success = await deletePlaylist(id);
      if (success) {
        // ✅ Modify the actual global reactive array
        playlists.value = playlists.value.filter(p => p.id !== id);

        if (selectedPlaylistId.value === id) {
          selectedPlaylistId.value = null;
          selectedPlaylist.value = null;
        }
      }

      deletingPlaylistId.value = null;
    }

    async function handleRenamePlaylist({ id, newName }) {
      const playlist = playlists.value.find(p => p.id === id);
      if (!playlist) return;

      const oldName = playlist.name;
      if (newName === oldName) return;

      // Optimistically update UI
      playlist.name = newName;
      renamingPlaylistId.value = id;

      try {
        const success = await renamePlaylist(id, newName);
        if (!success) {
          // Roll back if it fails
          playlist.name = oldName;
        }
      } catch (err) {
        console.error("❌ Failed to rename playlist:", err);
        playlist.name = oldName; // Roll back on error
      } finally {
        renamingPlaylistId.value = null;
      }
    }

    async function handleRemoveSong(songId) {
      if (!selectedPlaylist.value) return;

      removingSongId.value = songId;

      const playlistId = selectedPlaylist.value.id;
      try {
        const success = await removeFromPlaylist(playlistId, songId);
        if (success) {
          selectedPlaylist.value.songs = selectedPlaylist.value.songs.filter(s => s.id !== songId);

          const playlist = playlists.value.find(p => p.id === playlistId);
          if (playlist) {
            playlist.songs = playlist.songs.filter(id => id !== songId);
          }
        }
      } catch (err) {
        console.error("❌ Failed to remove song from playlist:", err);
      } finally {
        removingSongId.value = null;
      }
    }

    async function handleMoveSongTo({ songId, toPlaylistId }) {

      try {
        const success = await addToPlaylist(toPlaylistId, songId);
        if (success) {
          const playlist = playlists.value.find(p => p.id === toPlaylistId);
          if (playlist && !playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
          }
        }
      } catch (err) {
        console.error(`❌ Failed to move song ${songId} to playlist ${toPlaylistId}:`, err);
      }
    }

    function handleConnectSpotify() {
      console.log("🔗 Connect Spotify");
      // TODO: Launch Spotify OAuth flow
    }

    function handleExportToSpotify(playlistId) {
      console.log("📤 Export to Spotify:", playlistId);
      // TODO: API call to export playlist
    }

    async function handleCreatePlaylist(name) {
      if (!name || !name.trim()) return;
      creatingPlaylist.value = true;

      try {
        const newPlaylist = await createPlaylist(name.trim());

        if (newPlaylist) {
          newPlaylist.songs = [];
          playlists.value.unshift(newPlaylist); // Add it to the top
        }
      } catch (err) {
        console.error("❌ Failed to create playlist:", err);
      } finally {
        creatingPlaylist.value = false;
      }
    }

    function handleBack() {
      selectedPlaylist.value = null;
      selectedPlaylistId.value = null;
    }

    onMounted(fetchData);

    // Re-check scroll indicator visibility after content updates
    watchEffect(() => {
      checkScroll();
      // console.log("📦 selectedPlaylist songs:", selectedPlaylist.value?.songs);
    });

    return {
      playlists,
      selectedPlaylist,
      isSpotifyConnected,
      handleSelectPlaylist,
      handleRenamePlaylist,
      handleDeletePlaylist,
      handleRemoveSong,
      handleMoveSongTo,
      handleCreatePlaylist,   
      handleConnectSpotify,
      handleExportToSpotify,
      handleBack,
      showScrollIndicator,
      checkScroll,
      playlistScrollRef,
      filterQuery,
      filteredPlaylists,
      isLoading,
      creatingPlaylist,
      deletingPlaylistId,
      renamingPlaylistId,
      removingSongId,
      activeModalComponent,
      activeModalProps,
    };
  },
};
</script>
