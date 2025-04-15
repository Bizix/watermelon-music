<!-- components/PlaylistControls.vue -->
<template>
    <div class="w-full bg-surface-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div class="flex-grow">
        <input
          v-model="search"
          type="text"
          placeholder="Filter playlists..."
          class="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          @input="$emit('filter', search)"
        />
      </div>
  
      <div class="flex gap-2 justify-end">
        <button
          class="px-3 py-2 text-sm font-medium text-white bg-[var(--p-primary-color)] hover:bg-[var(--p-primary-400)] rounded"
          @click="$emit('createPlaylist')"
        >
          + New Playlist
        </button>
  
        <button
          v-if="!isSpotifyConnected"
          @click="$emit('connectSpotify')"
          class="px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded"
        >
          Connect Spotify
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  const search = defineModel("search", { default: "" });
  defineProps(["isSpotifyConnected"]);
  defineEmits(["filter", "createPlaylist", "connectSpotify"]);
  </script>
  