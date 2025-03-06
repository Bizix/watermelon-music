<template>
  <div class="bg-gray-900 pt-3 text-white w-full mx-auto shadow-lg flex flex-col h-screen">
    <h1 class="text-center text-3xl font-extrabold text-green-500 mb-4">
      Melon Chart - {{ genreMap[selectedGenre] || "Unknown Genre" }}
    </h1>

    <!-- ✅ Ensure GenreSelector remains at the top -->
    <div v-if="!isLoading" class="w-full">
      <GenreSelector 
        :selectedGenre="selectedGenre"
        @genre-selected="handleGenreChange"
        class="w-full"
      />
    </div>

    <!-- ✅ Loading Bar -->
    <LoadingBar :isLoading="isLoading" message="Fetching latest rankings, please wait..." />

    <!-- ✅ Scrollable song list (Takes remaining height) -->
    <div 
      v-if="!isLoading" 
      ref="songList"
      class="overflow-y-auto flex-grow w-full scrollbar-hidden"
      @scroll="checkScroll"
    >
      <SongCard 
        v-for="song in filteredRankings" 
        :key="song.id" 
        :song="song" 
      />
    </div>

    <!-- ✅ Extracted Scroll Indicator Component -->
    <ScrollIndicator :showScrollIndicator="showScrollIndicator" />
  </div>
</template>

<script>
import GenreSelector from "@/components/GenreSelector.vue";
import LoadingBar from "@/components/LoadingBar.vue";
import SongCard from "@/components/SongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import { fetchRankings } from "@/api/fetchRankings.ts";

export default {
  components: {
    GenreSelector,
    LoadingBar,
    SongCard,
    ScrollIndicator
  },
  data() {
    return {
      selectedGenre: "DM0000", // ✅ Moved state here
      rankings: [],
      isLoading: false,
      showScrollIndicator: true, // ✅ Scroll Indicator Visibility
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
  computed: {
    filteredRankings() {
      return this.rankings.filter(song => !isNaN(song.rank));
    }
  },
  methods: {
    async fetchRankings(genreCode) {
      this.isLoading = true;
      this.rankings = await fetchRankings(genreCode);
      this.isLoading = false;
      this.$nextTick(() => this.checkScroll());
    },
    checkScroll() {
      const songList = this.$refs.songList;
      if (songList) {
        const isAtBottom = Math.abs(songList.scrollTop + songList.clientHeight - songList.scrollHeight) < 2;
        this.showScrollIndicator = !isAtBottom;
      }
    },
    handleGenreChange(newGenre) {
      this.selectedGenre = newGenre; // ✅ Update selectedGenre
      this.fetchRankings(newGenre);
    }
  },
  mounted() {
    this.fetchRankings("DM0000");
  },
};
</script>
