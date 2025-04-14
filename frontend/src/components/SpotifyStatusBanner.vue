<template>
    <div class="w-full bg-surface-100 px-4 py-2 flex justify-between items-center border-b">
      <div>
        <span v-if="!isSpotifyConnected" class="text-red-500 font-medium text">
          Not connected to Spotify
        </span>
        <span v-else class="text-green-500 font-medium">
          Spotify connected ✅
        </span>
      </div>
  
      <div class="flex gap-2">
        <button
          v-if="!isSpotifyConnected"
          @click="$emit('connectSpotify')"
          class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          Connect Spotify
        </button>
  
        <button
          v-if="isSpotifyConnected && selectedPlaylist"
          @click="$emit('exportToSpotify', selectedPlaylist.id)"
          class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Export to Spotify
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
    defineProps(['isSpotifyConnected', 'selectedPlaylist']);
    defineEmits(['connectSpotify', 'exportToSpotify']);
  </script>
  