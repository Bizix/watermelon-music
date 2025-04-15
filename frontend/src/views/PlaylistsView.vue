<!-- views/PlaylistsView.vue -->
<template>
  <!-- ✅ Playlist Control component -->
  <PlaylistControls
    :isSpotifyConnected="isSpotifyConnected"
    v-model="filterQuery"
    @connectSpotify="handleConnectSpotify"
    @create="handleCreatePlaylist"
  />


  <!-- ✅ Scrollable Content -->
  <div
    v-if="!isLoading"
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
          @select="handleSelectPlaylist"
          @rename="handleRename"
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
        :currentPlaylistId="selectedPlaylist.id"
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
</template>

<script>
import { ref, onMounted, watchEffect, nextTick, inject, computed } from "vue";

import { fetchPlaylists } from "@/api/fetchPlaylists";
import { usePlaylist } from "@/composables/usePlaylist";

import PlaylistControls from "@/components/PlaylistControls.vue";
import PlaylistItem from "@/components/PlaylistItem.vue";
import PlaylistDetails from "@/components/PlaylistDetails.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import PlaylistSongCard from "@/components/PlaylistSongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";


export default {
  components: {
    PlaylistControls,
    PlaylistItem,
    PlaylistDetails,
    LoadingSpinner,
    ScrollIndicator,
  },

  setup() {
    const playlists = inject("playlists"); 
    const { deletePlaylist } = usePlaylist();
    const filterQuery = ref("");
    const selectedPlaylistId = ref(null);
    const selectedPlaylist = ref(null);
    const isLoading = ref(true);
    const playlistScrollRef = ref(null);
    const deletingPlaylistId = ref(null);
    const { showScrollIndicator, checkScroll } = useScrollIndicator(playlistScrollRef);
    const isSpotifyConnected = ref(false); // This should be updated based on real auth check

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


    function handleSelectPlaylist(id) {
      selectedPlaylistId.value = id;
      selectedPlaylist.value = playlists.value.find(p => p.id === id);
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

    function handleRenamePlaylist(id) {
      console.log("✏️ Rename playlist:", id);
      // TODO: Add modal or inline rename logic
    }

    function handleRemoveSong(songId) {
      console.log("❌ Remove song:", songId);
      // TODO: API call to remove song from playlist
    }

    function handleMoveSong({ songId, toPlaylistId }) {
      console.log(`➡️ Move song ${songId} to playlist ${toPlaylistId}`);
      // TODO: API call to move song
    }

    function handleConnectSpotify() {
      console.log("🔗 Connect Spotify");
      // TODO: Launch Spotify OAuth flow
    }

    function handleExportToSpotify(playlistId) {
      console.log("📤 Export to Spotify:", playlistId);
      // TODO: API call to export playlist
    }

    function handleCreatePlaylist() {
      console.log("🆕 Open Create Playlist Modal");
      // Reuse create playlist logic here
    }

    onMounted(fetchData);

    // Re-check scroll indicator visibility after content updates
    watchEffect(() => {
      checkScroll();
    });

    return {
      playlists,
      selectedPlaylist,
      isLoading,
      isSpotifyConnected,
      handleSelectPlaylist,
      handleRenamePlaylist,
      handleDeletePlaylist,
      handleRemoveSong,
      handleMoveSong,
      handleConnectSpotify,
      handleExportToSpotify,
      showScrollIndicator,
      checkScroll,
      playlistScrollRef,
      filterQuery,
      handleCreatePlaylist,      
      filteredPlaylists,
    };
  },
};
</script>
