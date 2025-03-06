<template>
    <Card 
      class="p-4 border border-gray-700 bg-gray-800 text-white cursor-pointer transition-transform hover:scale-105"
      @click="toggleExpand"
    >
      <template #title>
        <div class="flex items-center space-x-4">
          <span class="text-green-400 font-bold text-lg">{{ song.rank }}</span>
          <img :src="song.art" :alt="song.album" class="w-16 h-16 rounded-md object-cover border border-gray-600" />
          <p class="text-lg font-semibold">{{ song.artist }}</p>
          <p class="text-sm text-gray-400 italic">{{ song.album }}</p>
        </div>
      </template>
  
      <!-- Expandable Content -->
      <template #content v-if="isExpanded">
        <hr class="border-gray-600 my-2" />
        <div class="flex space-x-3">
          <a v-if="song.youtube_url" :href="song.youtube_url" target="_blank" class="text-red-400 hover:text-red-600">🎥 YouTube</a>
          <a v-if="song.genius_url" :href="song.genius_url" target="_blank" class="text-yellow-400 hover:text-yellow-600">🎵 Genius</a>
          <a v-if="song.spotify_url" :href="song.spotify_url" target="_blank" class="text-green-400 hover:text-green-600">🎶 Spotify</a>
        </div>
      </template>
    </Card>
  </template>
  
  <script>
  import Card from "primevue/card";
  
  export default {
    components: {
      Card,
    },
    props: {
      song: Object,
    },
    data() {
      return {
        isExpanded: false,
      };
    },
    methods: {
      toggleExpand() {
        this.isExpanded = !this.isExpanded;
      },
    },
  };
  </script>
  