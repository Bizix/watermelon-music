<template>
    <!-- ✅ Header Section -->
    <div class="relative flex justify-center items-center my-6">
      <!-- ✅ Title -->
      <h1 class="text-3xl font-extrabold text-center"
          :style="{ color: 'var(--p-primary-color)' }">
        WaterMelon Music
      </h1>

      <!-- ✅ Theme Toggle Button -->
      <button
        @click="toggleDarkMode"
        class="absolute right-4 top-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-lg"></i>
        <i v-else class="pi pi-sun text-lg"></i>
      </button>
    </div>
</template>

<script setup>
import { inject, defineProps } from "vue";

const isDarkMode = inject("isDarkMode");
const toggleDarkMode = inject("toggleDarkMode");

const handleLogin = () => {
  console.log("🔑 Login button clicked! (Implement Supabase login here)");
};
</script>