<template>
  <div 
    class="w-full flex flex-col bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-700 
           hover:bg-gray-700 transition-colors"
    :class="{ 'bg-gray-700': isExpanded }"
  >
    <div class="flex items-center gap-4 w-full">
      <!-- ✅ Rank -->
      <span class="text-green-400 font-bold text-lg min-w-[30px] text-center">{{ song.rank }}</span>

      <!-- ✅ Album Art -->
      <img :src="song.art" :alt="song.album" class="w-16 h-16 rounded-md object-cover border border-gray-600" />

      <!-- ✅ Song Info (Artist & Album) -->
      <div class="flex flex-col flex-grow">
        <p class="text-lg font-semibold">{{ song.artist }}</p>
        <p class="text-sm text-gray-400 italic">{{ song.album }}</p>
      </div>

      <!-- ✅ Action Buttons -->
      <div class="flex items-center gap-3">
        <a :href="song.youtube_url || '#'" target="_blank" 
           class="text-xl" 
           :class="{ 'opacity-50 cursor-not-allowed': !song.youtube_url, 'text-red-500 hover:text-red-600': song.youtube_url }">
          <i class="pi pi-youtube"></i>
        </a>
        <a :href="song.apple_music_url || '#'" target="_blank" 
           class="text-xl" 
           :class="{ 'opacity-50 cursor-not-allowed': !song.apple_music_url, 'text-gray-300 hover:text-gray-400': song.apple_music_url }">
          <i class="pi pi-apple"></i>
        </a>
        <a :href="song.spotify_url || '#'" target="_blank" 
           class="text-xl" 
           :class="{ 'opacity-50 cursor-not-allowed': !song.spotify_url, 'text-green-400 hover:text-green-500': song.spotify_url }">
           <i class="fab fa-spotify"></i> <!-- ✅ Using FontAwesome instead -->
        </a>
        <button 
          @click="toggleExpand" 
          class="px-3 py-1 text-sm font-medium bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer">
          Lyrics
        </button>
      </div>
    </div>

    <!-- ✅ Expanded Lyrics Section (Same Card Background & Width) -->
    <transition name="fade">
      <div v-if="isExpanded" class="mt-3 p-3 rounded-lg bg-gray-700 border-t border-gray-600 w-full">
        <p class="text-gray-300 italic">Lyrics will go here...</p>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    song: Object,
  },
  data() {
    return {
      isExpanded: false,
    };
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
  },
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
