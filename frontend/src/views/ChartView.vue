<template>
  <div class="bg-gray-900 text-white p-6 rounded-lg max-w-6xl mx-auto shadow-lg">
    <h1 class="text-center text-3xl font-extrabold text-green-500 mb-4">
      Melon Chart - {{ selectedGenre }}
    </h1>

    <!-- ✅ Updated Genre Selector -->
  <div v-if="!isLoading">
    <GenreSelector @genre-selected="fetchRankings" />
  </div>

    <!-- ✅ Loading Bar -->
    <LoadingBar :isLoading="isLoading" message="Fetching latest rankings, please wait..." />

    <!-- ✅ Scrollable container for 100 songs -->
    <div v-if="!isLoading" class="overflow-y-auto max-h-[75vh] px-4 space-y-4">
      <SongCard 
        v-for="song in rankings" 
        :key="song.id" 
        :song="song" 
      />
    </div>
  </div>
</template>

<script>
import GenreSelector from "@/components/GenreSelector.vue";
import LoadingBar from "@/components/LoadingBar.vue";
import SongCard from "@/components/SongCard.vue";
import axios from "axios";

export default {
  components: {
    GenreSelector,
    LoadingBar,
    SongCard
  },
  data() {
    return {
      selectedGenre: "Top 100",
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
        this.isLoading = true;
        const response = await axios.get(`http://localhost:5000/api/rankings?genre=${genreCode}`);
        this.rankings = response.data
          .map(song => ({
            ...song,
            rank: Number(song.rank),
          }))
          .sort((a, b) => a.rank - b.rank);
        this.selectedGenre = this.genreMap[genreCode] || "Unknown Genre";
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        this.isLoading = false;
      }
    }
  },
  mounted() {
    this.fetchRankings("DM0000");
  },
};
</script>
