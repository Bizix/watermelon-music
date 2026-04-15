<!-- views/PlaylistsView.vue -->
<template>
  <!-- ✅ Playlist Control component -->
  <PlaylistControls
    :isSpotifyConnected="isSpotifyConnected"
    :selectedPlaylist="selectedPlaylist"
    :selectedPlaylistSongs="selectedPlaylist?.songs || []"
    :isOrderDirty="isOrderDirty"
    v-model="filterQuery"
    @connectSpotify="handleConnectSpotify"
    @exportToSpotify="handleExportToSpotify"
    @create="handleCreatePlaylist"
    @back="handleBack"
    @saveOrder="handleSaveOrder"
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
      class="min-h-0 flex-1 overflow-y-auto scrollbar-hidden"
      @scroll="checkScroll"
    >
      <!-- 1️⃣ Detail is loading, show a single spinner -->
      <template v-if="isDetailLoading">
        <div class="w-full flex justify-center py-8">
          <LoadingSpinner
            :isLoading="true"
            message="Loading playlist…"
            size="w-10 h-10"
            color="fill-green-500"
          />
        </div>
      </template>

      <!-- 2️⃣ Not loading & no playlist selected: show the list -->
      <template v-else-if="!selectedPlaylist">
        <div v-for="playlist in filteredPlaylists" :key="playlist.id">
          <!-- deleting‑spinner / PlaylistItem as before -->
          <div v-if="deletingPlaylistId === playlist.id" class="w-full flex justify-center py-4">
            <LoadingSpinner
              :isLoading="true"
              message="Deleting..."
              size="w-8 h-8"
              color="fill-red-500"
            />
          </div>
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

      <!-- 3️⃣ Not loading & a playlist is selected: show detail -->
      <template v-else>
        <Draggable
          v-model="selectedPlaylist.songs"
          itemKey="id"
          :tag="'div'"
          ghost-class="bg-gray-100"
          handle=".drag-handle"
          :delay="0"
        >
          <template #item="{ element }">
            <div :key="element.id">
              <PlaylistSongCard
                :key="element.id"
                :song="element"
                :allPlaylists="playlists"
                :currentPlaylistId="String(selectedPlaylist.id)"
                :playlistName="selectedPlaylist.name"
                :removing="removingSongId === element.id"
                @removeSong="handleRemoveSong"
                @moveSongTo="handleMoveSongTo"
              />
            </div>
          </template>
        </Draggable>
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
    :modalProps="activeModalProps"
    @close="activeModalComponent = null"
  />
</template>
<script>
import { ref, onMounted, inject, computed, watch } from "vue";

import { fetchPlaylists } from "@/api/fetchPlaylists";
import { usePlaylist } from "@/composables/usePlaylist";
import { fetchSongsByPlaylistId } from "@/api/fetchSongsByIds";

import PlaylistControls from "@/components/PlaylistControls.vue";
import PlaylistItem from "@/components/PlaylistItem.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import PlaylistSongCard from "@/components/PlaylistSongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";
import Modal from "@/components/Modal.vue";
import Draggable from "vuedraggable";


export default {
  inheritAttrs: false,
  components: {
    PlaylistControls,
    PlaylistItem,
    PlaylistSongCard,
    LoadingSpinner,
    ScrollIndicator,
    Modal,
    Draggable,
  },

  setup() {
    const user = inject("user");
    const accessToken = inject("accessToken");
    const playlists = inject("playlists"); 
    const filterQuery = ref("");
    const selectedPlaylistId = ref(null);
    const selectedPlaylist = ref(null);
    const activeModalComponent = ref(null);
    const activeModalProps = ref({});
    const isLoading = ref(true);
    const isDetailLoading = ref(false);
    const playlistScrollRef = ref(null);
    const deletingPlaylistId = ref(null);
    const creatingPlaylist = ref(false);
    const renamingPlaylistId = ref(null);
    const removingSongId = ref(null);

    const previousOrder = ref([]);
    const isOrderDirty = ref(false);
    
    const isSpotifyConnected = inject("isSpotifyConnected");

    const { deletePlaylist, renamePlaylist, createPlaylist, addToPlaylist, removeFromPlaylist, reorderPlaylistSongs } = usePlaylist();

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
      // 🧠 Refresh playlists in case they were reset
      isDetailLoading.value = true;

      if (!playlists.value.length) {
        playlists.value = await fetchPlaylists();
      }

      selectedPlaylistId.value = id;
      const rawPlaylists = [...playlists.value]; // break reactivity
      const playlist = rawPlaylists.find(p => p.id === id);

      if (playlist && typeof playlist === "object") {
        try {
          const songs = await fetchSongsByPlaylistId(playlist.id);

          selectedPlaylist.value = { ...playlist, songs };
          previousOrder.value = songs.map(song => song.id);
        } catch (err) {
          console.error("❌ Failed to load songs for playlist:", err);
        }
      } else {
        console.warn("⚠️ Playlist not found for ID:", id);
      }
      isDetailLoading.value = false;
    }

    

    async function handleSaveOrder() {
      if (!selectedPlaylist.value) return;
      const reorderedIds = selectedPlaylist.value.songs.map(s => s.id);

      try {
        const success = await reorderPlaylistSongs(selectedPlaylist.value.id, reorderedIds);
        if (success) {
          previousOrder.value = [...reorderedIds]; // ✅ Reset dirty state
          isOrderDirty.value = false;

        }
      } catch (err) {
        console.error("❌ Failed to save playlist order:", err);
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

    async function handleConnectSpotify() {
      if (!user.value?.id) {
        console.warn("🛑 User not logged in");
        return;
      }

      const currentPath = window.location.pathname || "/";
      const loginUrl = `${import.meta.env.VITE_API_BASE_URL}/api/spotify/login?from=${encodeURIComponent(currentPath)}&user_id=${user.value.id}`;

      window.location.href = loginUrl;
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


    async function handleExportToSpotify() {
      if (!selectedPlaylist.value) return;

      try {        
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spotify/export-playlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken.value}`,
          },
          body: JSON.stringify({ playlistId: selectedPlaylist.value.id }),
        });

        const result = await res.json();
        if (res.ok && result.playlistUrl) {
          window.open(result.playlistUrl, "_blank"); // 🎉 Opens playlist in Spotify
        } else {
          console.error("❌ Failed to export playlist:", result.error);
        }
      } catch (err) {
        console.error("❌ Export to Spotify failed:", err);
      }
    }


    onMounted(fetchData);

    watch(
      [playlistScrollRef, isLoading, isDetailLoading, creatingPlaylist, selectedPlaylist, filteredPlaylists],
      () => {
        checkScroll();
      },
      { immediate: true, deep: true }
    );
    
    watch(
      () => selectedPlaylist.value?.songs?.map(s => s.id),
      (newOrder) => {
        isOrderDirty.value = JSON.stringify(newOrder) !== JSON.stringify(previousOrder.value);
      },
      { deep: true }
    );


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
      handleSaveOrder,
      showScrollIndicator,
      checkScroll,
      playlistScrollRef,
      filterQuery,
      filteredPlaylists,
      isOrderDirty,
      isLoading,
      isDetailLoading,
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
