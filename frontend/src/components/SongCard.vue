<template>
  <div 
    class="w-full flex flex-col bg-gray-800 text-white p-4 shadow-lg border border-gray-700 
           hover:bg-gray-700 transition-colors w-full"
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
        <template v-for="(button, index) in actionButtons" :key="index">
          <a 
            :href="button.url || '#'" 
            target="_blank" 
            class="text-xl"
            :class="{ 'opacity-50 cursor-not-allowed': !button.url, [button.color]: button.url }"
          >
            <i :class="button.icon"></i>
          </a>
        </template>
        <button 
          @click="toggleExpand" 
          class="px-3 py-1 text-sm font-medium bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer"
        >
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
    song: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isExpanded: false,
    };
  },
  computed: {
    actionButtons() {
      return [
        { url: this.song.youtube_url, icon: "pi pi-youtube", color: "text-red-500 hover:text-red-600" },
        { url: this.song.apple_music_url, icon: "pi pi-apple", color: "text-gray-300 hover:text-gray-400" },
        { url: this.song.spotify_url, icon: "fab fa-spotify", color: "text-green-400 hover:text-green-500" }
      ];
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
      this.$emit("toggle-expand", this.isExpanded);
    }
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
