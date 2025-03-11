<template>
  <div class="song-card w-full flex flex-col p-4 shadow-lg border-t transition-colors">
      
    <div class="flex items-center gap-4 w-full">
      <!-- ✅ Rank -->
      <span class="font-bold text-lg min-w-[30px] text-center text-primary-500">
        {{ song.rank }}
      </span>

      <!-- ✅ Album Art -->
      <img 
        :src="song.art" 
        :alt="song.album"
        class="w-16 h-16 rounded-md object-cover border border-surface-400"
      />

      <!-- ✅ Song Info -->
      <div class="flex flex-col flex-grow">
        <p class="text-lg font-semibold text-surface-900">{{ song.title }}</p>
        <p class="text-lg text-surface-800">{{ song.artist }}</p>
        <p class="text-sm italic text-surface-600">{{ song.album }}</p>
      </div>

      <!-- ✅ Action Buttons (Only Rendered If URL Exists) -->
      <div class="flex items-center gap-3">
        <template v-for="(button, index) in actionButtons" :key="index">
          <a
            v-if="button.url"
            :href="button.url"
            target="_blank"
            class="text-xl"
            :class="button.color"
          >
            <i :class="button.icon"></i>
          </a>
        </template>

        <button @click="toggleExpand"
          class="px-3 py-1 text-sm font-medium rounded-lg cursor-pointer transition-colors 
                bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]">
          Lyrics
        </button>

      </div>
    </div>

    <!-- ✅ Expanded Lyrics Section -->
    <transition name="fade">
      <div v-if="isExpanded" class="mt-3 p-3 rounded-lg border-t w-full bg-surface-200 border-surface-300">
        <p class="italic text-surface-700">Lyrics will go here...</p>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed } from "vue";

export default {
  props: {
    song: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isExpanded = ref(false);
    const cache = new Map(); // ✅ Simple in-memory cache

    async function openYouTube() {
      let youtubeUrl = cache.get(props.song.id) || props.song.youtube_url;

      if (!youtubeUrl) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/youtube?title=${encodeURIComponent(props.song.title)}&artist=${encodeURIComponent(props.song.artist)}`
          );

          const data = await response.json();
          if (response.ok && data.youtubeUrl) {
            youtubeUrl = data.youtubeUrl;
            cache.set(props.song.id, youtubeUrl);
          } else {
            console.error("❌ No YouTube URL found:", data.error);
            return;
          }
        } catch (error) {
          console.error("❌ Failed to fetch YouTube URL:", error);
          return;
        }
      }

      // ✅ Open YouTube link in a new tab
      window.open(youtubeUrl, "_blank");
    }

    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
    };

    const actionButtons = computed(() => [
      { url: props.song.youtube_url, icon: "pi pi-youtube", color: "text-red-500 hover:text-red-600", action: openYouTube },
      { url: props.song.apple_music_url, icon: "pi pi-apple", color: "text-gray-300 hover:text-gray-400" },
      { url: props.song.spotify_url, icon: "fab fa-spotify", color: "text-green-400 hover:text-green-500" }
    ]);

    return {
      openYouTube,
      isExpanded,
      toggleExpand,
      actionButtons,
    };
  }
};
</script>

<style scoped>
/* ✅ Smooth Fade Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
