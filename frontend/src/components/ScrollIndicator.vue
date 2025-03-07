<template>
  <div 
    v-if="showScrollIndicator" 
    class="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t flex justify-center items-end pointer-events-none"
    :class="gradientClass"
  >
    <p class="text-[var(--p-text-secondary)] text-sm animate-bounce">↓ Scroll for more ↓</p>
  </div>
</template>

<script>
import { computed, inject } from "vue";

export default {
  props: {
    showScrollIndicator: Boolean, // ✅ Accept boolean prop
  },
  setup() {
    // ✅ Detect if dark mode is active
    const isDarkMode = inject("isDarkMode", false);

    // ✅ Adjust gradient dynamically based on mode
    const gradientClass = computed(() =>
      isDarkMode.value
        ? "from-[var(--p-surface-100)] to-transparent"
        : "from-[var(--p-surface-300)] to-transparent"
    );

    return {
      gradientClass,
    };
  },
};
</script>