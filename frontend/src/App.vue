<script setup>
import { useDarkMode } from "@/composables/useDarkMode";

import AppHeader from "@/components/AppHeader.vue";
import ChartView from "@/views/ChartView.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();
</script>

<template>
  <div class="relative min-h-screen">
    <div class="chart-container pt-3 w-full mx-auto flex flex-col h-screen transition-colors">
    <!-- ✅ New Header Component -->
    <AppHeader />
    
        <!-- ✅ Main Chart View -->
    <ChartView />
    </div>
  </div>
</template>
