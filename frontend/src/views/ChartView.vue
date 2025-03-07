<template>
<div class="pt-3 w-full mx-auto shadow-lg flex flex-col h-screen transition-colors"
     :style="{ backgroundColor: 'var(--p-surface-0)', color: 'var(--p-text-primary)' }">
    <!-- ✅ Title -->
    <h1 class="text-center text-3xl font-extrabold mb-4"
    :style="{ color: 'var(--p-primary-color)' }">
  Melon Chart - {{ genreMap[selectedGenre] || 'Unknown Genre' }}
</h1>

    <!-- ✅ GenreSelector -->
    <div class="w-full">
      <GenreSelector 
        :selectedGenre="selectedGenre"
        :genreMap="genreMap"
        :isLoading="isLoading"  
        @genre-selected="handleGenreChange"
      />
    </div>

    <!-- ✅ Loading Bar (Fixed Visibility) -->
    <div v-if="isLoading" class="w-full min-w-full flex flex-grow h-full items-center justify-center">
      <LoadingBar :isLoading="isLoading" message="Loading songs..." size="h-2" :color="loadingBarColor" />
    </div>

    <!-- ✅ Scrollable song list -->
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

    // ✅ Inject global dark mode state
    const isDarkMode = inject("isDarkMode", ref(false));

    // ✅ Dynamic classes for dark/light mode
    const containerClass = computed(() =>
      isDarkMode.value ? "bg-gray-900 text-white" : "bg-white text-gray-900"
    );

    const titleClass = computed(() =>
      isDarkMode.value ? "text-green-400" : "text-green-500"
    );

    const loadingBarColor = computed(() =>
      isDarkMode.value ? "bg-green-400" : "bg-green-500"
    );

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
      containerClass,
      titleClass,
      loadingBarColor,
    };
  },
};
</script>
