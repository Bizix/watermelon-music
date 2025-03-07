<template>
  <div v-if="isLoading" class="flex flex-col items-center justify-center h-full w-full flex-grow">
    <div class="w-1/2 rounded-full animate-pulse" :class="[loadingSize, loadingColor]"></div>
    <p class="text-gray-300 text-sm mt-2">{{ message }}</p>
  </div>
</template>

<script>
export default {
  props: {
    isLoading: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      default: "Fetching latest rankings, please wait...",
    },
    size: {
      type: String,
      default: "h-2", // Default thickness
    },
    color: {
      type: String,
      default: "bg-green-400", // Default loading color
    },
  },
  computed: {
    loadingSize() {
      return this.size;
    },
    loadingColor() {
      return this.color;
    },
  }
};
</script>
