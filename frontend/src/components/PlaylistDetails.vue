<template>
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">{{ playlist.name }}</h2>
      <ul>
        <li v-for="(song, index) in playlist.songs" :key="song">
          <div class="flex justify-between items-center py-2">
            <span>{{ index + 1 }}. {{ song }}</span>
            <div class="flex gap-2">
              <select v-model="targetPlaylist" class="text-sm">
                <option disabled value="">Move to...</option>
                <option v-for="pl in allPlaylists" :key="pl.id" :value="pl.id" v-if="pl.id !== playlist.id">
                  {{ pl.name }}
                </option>
              </select>
              <button @click="$emit('moveSongTo', { songId: song, toPlaylistId: targetPlaylist })" class="text-blue-500 text-xs">Move</button>
              <button @click="$emit('removeSong', song)" class="text-red-500 text-xs">Remove</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
    import { ref } from 'vue';
    const targetPlaylist = ref('');
  
    defineProps(['playlist', 'allPlaylists']);
    defineEmits(['removeSong', 'moveSongTo', 'reorderSongs']);
  </script>