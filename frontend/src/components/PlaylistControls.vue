<!-- component/PlaylistControls.vue -->
<template>
  <div class="w-full bg-surface-100 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
     <!-- Show back button if a playlist is selected -->
     <button
        v-if="selectedPlaylist"
        @click="$emit('back')"
        class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 w-full sm:w-auto"
        >
     ← All Playlists
     </button>
     <!-- ✅ Save Order Button -->
     <button
        v-if="selectedPlaylist"
        @click="$emit('saveOrder')"
        :disabled="!isOrderDirty"
        class="px-3 py-1 rounded text-sm transition w-full sm:w-auto"
        :class="{
        'bg-green-500 text-white hover:bg-green-600': isOrderDirty,
        'bg-gray-300 text-gray-500 cursor-not-allowed': !isOrderDirty
        }"
        >
     💾 Save Order
     </button>
     <button
        v-if="isSpotifyConnected && selectedPlaylist"
        @click="handleExportToSpotify"
        class="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600 w-full sm:w-auto"
      >
        Export Playlist to Spotify
      </button>
     <button
        v-if="youtubeExportUrl"
        @click="exportToYouTube"
        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 w-full sm:w-auto"
        >
     🎬 {{ exportLabel }}
     </button>
     <!-- ✅ Search Input -->
     <input
        v-if="!selectedPlaylist"
        v-model="internalValue"
        type="text"
        placeholder="Search playlists..."
        class="px-3 py-1 rounded border text-sm w-full sm:w-auto"
        />
     <!-- ✅ New Playlist Input -->
     <template v-if="showNewPlaylistInput && !selectedPlaylist">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
           <input
              v-model="newPlaylistName"
              type="text"
              placeholder="New playlist name..."
              class="px-3 py-1 rounded border text-sm w-full sm:w-auto"
              />
           <div class="flex gap-2 justify-center sm:justify-start">
              <button
                 @click="submitNewPlaylist"
                 :disabled="!newPlaylistName.trim()"
                 class="px-3 py-1 text-sm text-white rounded transition"
                 :class="{
                 'bg-green-500 hover:bg-green-600': newPlaylistName.trim(),
                 'bg-gray-300 cursor-not-allowed': !newPlaylistName.trim()
                 }"
                 >
              Create
              </button>
              <button
                 @click="cancelCreate"
                 class="text-sm text-gray-500 hover:underline"
                 >
              Cancel
              </button>
           </div>
        </div>
     </template>
     <!-- ✅ Button Group -->
     <div
        v-if="!showNewPlaylistInput && !selectedPlaylist"
        class="flex gap-2 justify-center sm:justify-end"
        >
        <button
           @click="showNewPlaylistInput = true"
           class="bg-[var(--p-primary-color)] text-white px-3 py-1 rounded text-sm hover:bg-[var(--p-primary-400)]"
           >
        Create Playlist
        </button>
        <button
           v-if="!isSpotifyConnected"
           @click="$emit('connectSpotify')"
           class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
           >
        Connect Spotify
        </button>
     </div>
  </div>
</template>


<script setup>
import { computed, ref } from "vue";
  // Define a prop for v-model
  const props = defineProps({
    modelValue: { type: String, default: "" },
    isSpotifyConnected: Boolean,
    selectedPlaylist: Object,
    selectedPlaylistSongs: { type: Array, default: () => [] },
    isOrderDirty: Boolean,
  });
  
  // Define emit with the update event for v-model
  const emit = defineEmits(["update:modelValue", "connectSpotify", "create", "back", "saveOrder", "exportToSpotify"]);

  // Using a computed getter/setter to bridge v-model automatically.
  const internalValue = computed({
    get() {
      return props.modelValue;
    },
    set(val) {
      emit("update:modelValue", val);
    }
  });

  const youtubeIds = computed(() =>
    props.selectedPlaylistSongs
      .filter(song => song.youtube_url)
      .map(song => song.youtube_url)
      .slice(0, 50)
  );

  const youtubeExportUrl = computed(() => {
    const ids = youtubeIds.value.map(id => `https://www.youtube.com/watch?v=${id}`).join(",");
    return ids.length > 0 ? `https://www.youtube.com/watch_videos?video_ids=${youtubeIds.value.join(",")}` : null;
  });

  const exportLabel = computed(() => {
    if (props.selectedPlaylistSongs.length > 50) {
      return "Export first 50 songs to YouTube";
    }
    return "Export Playlist to YouTube";
  });

  function exportToYouTube() {
    if (youtubeExportUrl.value) {
      window.open(youtubeExportUrl.value, "_blank");
    }
  }

  function handleExportToSpotify() {
    emit("exportToSpotify");
  }

  const showNewPlaylistInput = ref(false);
  const newPlaylistName = ref("");

  function submitNewPlaylist() {
    if (newPlaylistName.value.trim()) {
      emit("create", newPlaylistName.value.trim());
      newPlaylistName.value = "";
      showNewPlaylistInput.value = false;
    }
  }

  function cancelCreate() {
    showNewPlaylistInput.value = false;
    newPlaylistName.value = "";
  }
</script>
