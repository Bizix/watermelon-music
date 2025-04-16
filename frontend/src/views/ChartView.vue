<!-- views/ChartView.vue -->
<template>
    <!-- ✅ Genre Selector -->
    <GenreSelector 
      :selectedGenre="selectedGenre"
      :genreMap="genreMap"
      :isLoading="isLoading"  
      @genre-selected="handleGenreChange"
    />

    <!-- ✅ Loading Spinner -->
    <div v-if="isLoading" class="flex flex-grow items-center justify-center">
      <LoadingSpinner :isLoading="true" message="Loading data..." size="w-10 h-10" color="fill-green-500" />
    </div>

    <!-- ✅ Song List -->
    <div v-if="!isLoading" ref="songListRef" class="overflow-y-auto flex-grow w-full scrollbar-hidden" @scroll="checkScroll">
      <SongCard 
      v-for="song in filteredRankings"
      :key="song.id" 
      :song="song"
      :active-dropdown-song-id="activeDropdownSongId"
      @update-active-dropdown="updateActiveDropdown"/>
    </div>

    <!-- ✅ Scroll Indicator -->
    <ScrollIndicator v-if="!isLoading" :showScrollIndicator="showScrollIndicator" />
</template>

<script>
import { ref, watchEffect, onMounted, inject } from "vue";
import GenreSelector from "@/components/GenreSelector.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import SongCard from "@/components/SongCard.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import { fetchRankings } from "@/api/fetchRankings.ts";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";

const genreMap = {
  DM0000: "Top 100",
  GN0100: "Ballads",
  GN0200: "K-Pop",
  GN0300: "K-Rap",
  GN0400: "R&B",
  GN0500: "Indie",
  GN0600: "Rock",
  GN0700: "Trot",
  GN0800: "Folk",
  GN1500: "OST",
  GN1700: "Jazz",
  GN1800: "New Age",
  GN1900: "J-Pop",
  GN2200: "Children",
  GN2400: "Korean Traditional",
};

export default {
  components: {
    GenreSelector,
    LoadingSpinner,
    SongCard,
    ScrollIndicator,
  },
  setup() {
    const selectedGenre = ref("DM0000");
    const rankings = ref([]);
    const isLoading = ref(true);
    const songListRef = ref(null);
    const { showScrollIndicator, checkScroll } = useScrollIndicator(songListRef);

    // New reactive state to track the active dropdown's song id.
    const activeDropdownSongId = ref(null);

    // When a song card toggles, update the active dropdown id.
      function updateActiveDropdown(songId) {
      activeDropdownSongId.value = activeDropdownSongId.value === songId ? null : songId;
    }

    // ✅ Inject global dark mode state & toggle function
    const isDarkMode = inject("isDarkMode");
    const toggleDarkMode = inject("toggleDarkMode");

    // ✅ Fetch rankings with error handling
    async function fetchData(genre) {
      isLoading.value = true;
      try {
        rankings.value = await fetchRankings(genre);
      } catch (error) {
        console.error("❌ Error fetching rankings:", error);
      } finally {
        isLoading.value = false;
      }
    }

    // ✅ Handle genre change
    async function handleGenreChange(newGenre) {
      selectedGenre.value = newGenre;
      await fetchData(newGenre);
    }

    // ✅ Filter out songs with null ranks
    const filteredRankings = ref([]);
      watchEffect(() => {
      filteredRankings.value = rankings.value.filter((song) => song.rank !== 0);
      checkScroll();
    });

    // ✅ Fetch initial rankings on mount
    onMounted(() => {
      fetchData("DM0000");
    });

    return {
      selectedGenre,
      rankings,
      isLoading,
      showScrollIndicator,
      checkScroll,
      handleGenreChange,
      filteredRankings,
      genreMap,
      songListRef,
      isDarkMode,
      toggleDarkMode,
      activeDropdownSongId,
      updateActiveDropdown,
    };
  },
};
</script>
