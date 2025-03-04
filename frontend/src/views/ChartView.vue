<template>
  <div class="bg-gray-900 text-white p-6 rounded-lg max-w-4xl mx-auto shadow-lg">
    <h1 class="text-center text-2xl font-bold text-green-500">Melon Chart - {{ selectedGenre }}</h1>
    
    <!-- Genre Selector Component -->
    <GenreSelector @genre-selected="fetchRankings" />

    <!-- ✅ Use Loading Bar Component -->
    <LoadingBar :isLoading="isLoading" message="Fetching latest rankings, please wait..." />

    
    <table v-if="!isLoading"class="w-full border-collapse mt-4">
      <thead>
        <tr class="bg-green-700 text-white">
          <th class="py-2 px-4">Rank</th>
          <th class="py-2 px-4">Title</th>
          <th class="py-2 px-4">Artist</th>
          <th class="py-2 px-4">Album</th>
          <th class="py-2 px-4">Links</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="song in rankings" :key="song.id" class="border-b border-gray-700 hover:bg-gray-800">
          <td class="py-2 px-4 text-center">{{ song.rank }}</td>
          <td class="py-2 px-4">{{ song.title }}</td>
          <td class="py-2 px-4">{{ song.artist }}</td>
          <td class="py-2 px-4">{{ song.album }}</td>
          <td class="py-2 px-4 space-x-2">
            <a v-if="song.youtube_url" :href="song.youtube_url" target="_blank" class="text-blue-500">YouTube</a>
            <a v-if="song.genius_url" :href="song.genius_url" target="_blank" class="text-blue-500">Genius</a>
            <a v-if="song.spotify_url" :href="song.spotify_url" target="_blank" class="text-blue-500">Spotify</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import GenreSelector from "@/components/GenreSelector.vue";
import LoadingBar from "@/components/LoadingBar.vue"; 
import axios from "axios";

export default {
  components: {
    GenreSelector,
    LoadingBar,  
  },
  data() {
    return {
      selectedGenre: "Top 100", // Default to Top 100
      rankings: [],
      isLoading: false,
      genreMap: {
        "DM0000": "Top 100",
        "GN0100": "Ballads",
        "GN0200": "K-Pop",
        "GN0300": "K-Rap",
        "GN0400": "R&B",
        "GN0500": "Indie",
        "GN0600": "Rock",
        "GN0700": "Trot",
        "GN0800": "Folk",
        "GN1500": "OST",
        "GN1700": "Jazz",
        "GN1800": "New Age",
        "GN1900": "J-Pop",
        "GN2200": "Children",
        "GN2400": "Korean Traditional",
      },
    };
  },
  methods: {
    async fetchRankings(genreCode) {
      try {
        this.isLoading = true; // ✅ FIXED: Start loading bar before fetching
        const response = await axios.get(`http://localhost:5000/api/rankings?genre=${genreCode}`);

        this.rankings = response.data
          .map(song => ({
            ...song,
            rank: Number(song.rank), // ✅ Ensure rank is treated as a number
          }))
          .sort((a, b) => a.rank - b.rank); // ✅ Sort numerically

        this.selectedGenre = this.genreMap[genreCode] || "Unknown Genre";
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        this.isLoading = false; // ✅ FIXED: Ensure the loading bar disappears after fetching
      }
    }
  },
  mounted() {
    this.fetchRankings("DM0000"); // ✅ Load "Top 100" by default
  },
};
</script>