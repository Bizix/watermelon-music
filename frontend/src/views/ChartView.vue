<template>
  <div class="chart-container pt-3 w-full mx-auto flex flex-col h-screen transition-colors">
    <!-- ✅ Header Section -->
    <div class="relative flex justify-center items-center my-6">
      <!-- ✅ Title -->
      <h1 class="text-3xl font-extrabold text-center"
          :style="{ color: 'var(--p-primary-color)' }">
        Melon Chart - {{ genreMap[selectedGenre] || 'Unknown Genre' }}
      </h1>

      <!-- ✅ Theme Toggle Button -->
      <button
        @click="toggleDarkMode"
        class="absolute right-4 top-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-lg"></i>
        <i v-else class="pi pi-sun text-lg"></i>
      </button>
    </div>

    <!-- ✅ Genre Selector -->
    <GenreSelector 
      :selectedGenre="selectedGenre"
      :genreMap="genreMap"
      :isLoading="isLoading"  
      @genre-selected="handleGenreChange"
    />

    <!-- ✅ Loading Bar -->
    <div v-if="isLoading" class="flex flex-grow items-center justify-center">
      <LoadingSpinner :isLoading="true" message="Loading data..." size="w-10 h-10" color="fill-green-500" />
    </div>

    <!-- ✅ Song List -->
    <div v-if="!isLoading" ref="songList" class="overflow-y-auto flex-grow w-full scrollbar-hidden" @scroll="checkScroll">
      <SongCard v-for="song in filteredRankings" :key="song.id" :song="song" />
    </div>

    <!-- ✅ Scroll Indicator -->
    <ScrollIndicator v-if="!isLoading" :showScrollIndicator="showScrollIndicator" />
  </div>
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
    const { showScrollIndicator, checkScroll, songList } = useScrollIndicator();

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
      songList,
      isDarkMode,
      toggleDarkMode,
    };
  },
};
</script>
