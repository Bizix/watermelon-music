<!-- components/PlaylistControls.vue -->
<template>
  <div class="w-full bg-surface-100 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
    <input
      v-model="searchQuery"
      @input="$emit('filter', searchQuery)"
      type="text"
      placeholder="Search playlists..."
      class="px-3 py-1 rounded border w-full sm:w-auto text-sm"
    />

    <div class="flex gap-2 justify-end">
      <button
        @click="$emit('create')"
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
const searchQuery = defineModel("searchQuery", { default: "" });
defineProps(["isSpotifyConnected"]);
defineEmits(["connectSpotify", "create", "filter"]);
</script>
