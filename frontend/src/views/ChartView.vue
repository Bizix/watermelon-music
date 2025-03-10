<template>
  <div class="pt-3 w-full mx-auto flex flex-col h-screen transition-colors"
       :style="{ backgroundColor: 'var(--p-surface-0)', color: 'var(--p-text-primary)' }">

    <!-- ✅ Header Section (Title Centered, Toggle Fixed on Right) -->
    <div class="relative flex justify-center items-center my-4">
      <!-- ✅ Title (Centered) -->
      <h1 class="text-3xl font-extrabold text-center"
          :style="{ color: 'var(--p-primary-color)' }">
        Melon Chart - {{ genreMap[selectedGenre] || 'Unknown Genre' }}
      </h1>

      <!-- ✅ Theme Toggle Button (Fixed on Right) -->
      <button
        @click="toggleDarkMode"
        class="absolute right-4 top-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-lg"></i>
        <i v-else class="pi pi-sun text-lg"></i>
      </button>
    </div>

    <!-- ✅ GenreSelector -->
    <div class="w-full">
      <GenreSelector 
        :selectedGenre="selectedGenre"
        :genreMap="genreMap"
        :isLoading="isLoading"  
        @genre-selected="handleGenreChange"
      />
    </div>

    <!-- ✅ Loading Bar -->
    <div v-if="isLoading" class="w-full flex flex-grow h-full items-center justify-center">
      <LoadingBar :isLoading="isLoading" message="Loading songs..." size="h-2" 
                  :style="{ backgroundColor: 'var(--p-primaryKey-color)' }" />
    </div>

    <!-- ✅ Song List -->
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

    <!-- ✅ Scroll Indicator -->
    <div v-if="!isLoading">
      <ScrollIndicator :showScrollIndicator="showScrollIndicator" />
    </div>
  </div>
</template>


<script>
import { ref, computed, watchEffect, onMounted, inject } from "vue";
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

    // ✅ Inject global dark mode state & toggle function
    const isDarkMode = inject("isDarkMode", ref(false));
    const toggleDarkMode = inject("toggleDarkMode", () => {});

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

    // ✅ Computed property for filtering NaN ranks
    const filteredRankings = computed(() =>
      rankings.value.filter((song) => !isNaN(song.rank))
    );

    // ✅ Fetch initial rankings after component mounts
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

