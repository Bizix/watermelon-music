<template>
  <div v-if="isLoading" class="text-center mt-4">
    <div 
      class="w-full rounded-full animate-pulse" 
      :class="[loadingSize, loadingColor]"
    ></div>
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
      default: "h-1", // Default thickness
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
