<template>
  <!-- ✅ Playlist Options -->
  <!-- <PlaylistOptions
    :selectedOption="selectedOption"
    :optionsMap="optionsMap"
    :isLoading="isLoading"
    @option-selected="handleOptionChange"
  /> -->

  <!-- ✅ Loading Spinner -->
  <div v-if="isLoading" class="flex flex-grow items-center justify-center">
    <LoadingSpinner :isLoading="true" message="Loading playlists..." size="w-10 h-10" color="fill-green-500" />
  </div>

  <!-- ✅ Playlist List -->
  <div v-if="!isLoading" ref="playlistListRef" class="overflow-y-auto flex-grow w-full scrollbar-hidden" @scroll="checkScroll">
    <PlaylistItem
      v-for="playlist in playlists"
      :key="playlist.id"
      :playlist="playlist"
      :active-dropdown-playlist-id="activeDropdownPlaylistId"
      @update-active-dropdown="updateActiveDropdown"
    />
  </div>

  <!-- ✅ Scroll Indicator -->
  <ScrollIndicator v-if="!isLoading" :showScrollIndicator="showScrollIndicator" />
</template>

<script>
import { ref, watchEffect, onMounted, inject } from "vue";
// import PlaylistOptions from "@/components/PlaylistOptions.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
// import PlaylistItem from "@/components/PlaylistItem.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
// import { fetchPlaylists } from "@/api/fetchPlaylists.ts";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";

const optionsMap = {
  my_playlists: "My Playlists",
  recommended: "Recommended",
  top_trending: "Top Trending",
  recently_played: "Recently Played",
};

export default {
  components: {
    // PlaylistOptions,
    // LoadingSpinner,
    // PlaylistItem,
    // ScrollIndicator,
  },
  setup() {
    const selectedOption = ref("my_playlists");
    const playlists = ref([]);
    const isLoading = ref(true);
    const playlistListRef = ref(null);
    const { showScrollIndicator, checkScroll } = useScrollIndicator(playlistListRef);

    // New reactive state to track the active dropdown's playlist id.
    const activeDropdownPlaylistId = ref(null);

    // When a playlist item toggles, update the active dropdown id.
    function updateActiveDropdown(playlistId) {
      activeDropdownPlaylistId.value = activeDropdownPlaylistId.value === playlistId ? null : playlistId;
    }

    // ✅ Inject global dark mode state & toggle function
    const isDarkMode = inject("isDarkMode");
    const toggleDarkMode = inject("toggleDarkMode");

    // ✅ Fetch playlists with error handling
    async function fetchData(option) {
      isLoading.value = true;
      try {
        playlists.value = await fetchPlaylists(option);
      } catch (error) {
        console.error("❌ Error fetching playlists:", error);
      } finally {
        isLoading.value = false;
      }
    }

    // ✅ Handle option change
    async function handleOptionChange(newOption) {
      selectedOption.value = newOption;
      await fetchData(newOption);
    }

    // ✅ Fetch initial playlists on mount
    onMounted(() => {
      fetchData("my_playlists");
    });

    watchEffect(() => {
      checkScroll();
    });

    return {
      selectedOption,
      playlists,
      isLoading,
      showScrollIndicator,
      checkScroll,
      handleOptionChange,
      optionsMap,
      playlistListRef,
      isDarkMode,
      toggleDarkMode,
      activeDropdownPlaylistId,
      updateActiveDropdown,
    };
  },
};
</script>