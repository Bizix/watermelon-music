<script setup>
import { useDarkMode } from "@/composables/useDarkMode";
import ChartView from "@/views/ChartView.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();
</script>

<template>
  <div class="relative min-h-screen">
    <ChartView />
  </div>
</template>
