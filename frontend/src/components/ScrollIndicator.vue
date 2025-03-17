<template>
  <div 
    v-if="showScrollIndicator" 
    class="absolute bottom-0 left-0 w-full h-12 flex justify-center items-end pointer-events-none"
    :style="gradientStyle"
  >
    <p class="text-[var(--p-text-secondary)] text-sm animate-bounce">↓</p>
  </div>
</template>

<script>
import { computed, inject } from "vue";

export default {
  props: {
    showScrollIndicator: Boolean,
  },
  setup() {
    const isDarkMode = inject("isDarkMode", false);

    // ✅ Apply radial gradient using inline styles (Vue binding)
    const gradientStyle = computed(() => ({
      background: isDarkMode.value
        ? "radial-gradient(ellipse at center, rgba(40,40,40,0.7) 0%, transparent 80%)"
        : "radial-gradient(ellipse at center, rgba(220,220,220,0.4) 0%, transparent 80%)",
    }));

    return {
      gradientStyle,
    };
  },
};
</script>
