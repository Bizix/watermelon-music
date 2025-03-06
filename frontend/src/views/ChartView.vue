<template>
  <div class="bg-gray-900 pt-3 text-white w-full mx-auto shadow-lg flex flex-col h-screen">
    <h1 class="text-center text-3xl font-extrabold text-green-500 mb-4">
      Melon Chart - {{ genreMap[selectedGenre] || "Unknown Genre" }}
    </h1>

    <!-- ✅ Ensure GenreSelector remains at the top -->
    <div v-if="!isLoading" class="w-full">
      <GenreSelector 
  :selectedGenre="selectedGenre"
  :genreMap="genreMap"
  @genre-selected="handleGenreChange"
/>

    </div>

    <!-- ✅ Loading Bar -->
    <LoadingBar :isLoading="isLoading" message="Loading songs..." size="h-2" color="bg-blue-500" />


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
import { ref, computed, watchEffect } from "vue";
import GenreSelector from "@/components/GenreSelector.vue";
import LoadingBar from "@/components/LoadingBar.vue";
import SongCard from "@/components/SongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import { fetchRankings } from "@/api/fetchRankings.ts";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";

const genreMap = {
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
};

export default {
  components: {
    GenreSelector,
    LoadingBar,
    SongCard,
    ScrollIndicator,
  },
  setup() {
    const selectedGenre = ref("DM0000");
    const rankings = ref([]);
    const isLoading = ref(true);
    const { showScrollIndicator, checkScroll, songList } = useScrollIndicator();

    // ✅ Fetch rankings on mount
    async function fetchData(genre) {
      isLoading.value = true;
      rankings.value = await fetchRankings(genre);
      isLoading.value = false;
    }

    // ✅ Run checkScroll() whenever rankings update
    watchEffect(() => {
      checkScroll();
    });

    // ✅ Handle genre change
    async function handleGenreChange(newGenre) {
      selectedGenre.value = newGenre;
      await fetchData(newGenre);
    }

    // ✅ Computed property for filtering NaN ranks
    const filteredRankings = computed(() => rankings.value.filter(song => !isNaN(song.rank)));

    // ✅ Fetch default rankings
    fetchData("DM0000");

    return {
      selectedGenre,
      rankings,
      isLoading,
      showScrollIndicator,
      checkScroll,
      handleGenreChange,
      filteredRankings,
      genreMap,
      songList,
    };
  },
};
</script>
