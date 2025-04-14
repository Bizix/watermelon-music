<!-- components/PlaylistSongCard.vue -->
<template>
    <div class="song-card w-full flex flex-col p-4 shadow-lg border-t"
         :data-song-id="song.id">
      <div class="flex items-center gap-4 w-full">
        <!-- ✅ Album Art -->
        <img :src="song.art" :alt="song.album"
             class="w-16 h-16 rounded-md object-cover border border-surface-400" />
  
        <!-- ✅ Song Info -->
        <div class="flex flex-col flex-grow">
          <p class="text-sm sm:text-lg font-semibold text-surface-900">
            {{ song.title }}
          </p>
          <p class="text-sm sm:text-lg text-surface-800">
            {{ song.artist }}
          </p>
          <p class="text-sm italic text-surface-600">
            {{ song.album }}
          </p>
        </div>
  
        <!-- ✅ Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center gap-2">
          <button
            class="text-xs text-red-600 hover:text-red-800"
            @click="$emit('removeSong', song.id)">
            Remove
          </button>
  
          <select v-model="targetPlaylist" class="text-xs text-gray-700 border rounded px-1 py-0.5">
            <option disabled value="">Move to...</option>
            <option v-for="pl in allPlaylists" :key="pl.id" :value="pl.id" v-if="pl.id !== currentPlaylistId">
              {{ pl.name }}
            </option>
          </select>
  
          <button
            v-if="targetPlaylist"
            class="text-xs text-blue-500 hover:text-blue-700"
            @click="$emit('moveSongTo', { songId: song.id, toPlaylistId: targetPlaylist })">
            Move
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  const targetPlaylist = ref("");
  
  defineProps({
    song: Object,
    allPlaylists: Array,
    currentPlaylistId: String,
  });
  
  defineEmits(["removeSong", "moveSongTo"]);
  </script>
  