<script setup>
import { ref, onMounted } from "vue";
import ChartView from "@/views/ChartView.vue";

// ✅ Theme toggle logic
const isDarkMode = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("app-dark", isDarkMode.value);
};

// ✅ Preserve user's theme preference across sessions
onMounted(() => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark") {
    isDarkMode.value = true;
    document.documentElement.classList.add("app-dark");
  }
});

const saveThemePreference = () => {
  localStorage.setItem("theme", isDarkMode.value ? "dark" : "light");
};
</script>

<template>
  <div class="relative min-h-screen">
    <!-- ✅ Theme Toggle Button -->
    <button
      @click="toggleDarkMode(); saveThemePreference()"
      class="absolute top-4 right-4 px-4 py-2 rounded-lg text-white transition-all duration-300"
      :class="isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-green-500 hover:bg-green-400'"
    >
      <i v-if="isDarkMode" class="pi pi-moon"></i>
      <i v-else class="pi pi-sun"></i>
    </button>

    <!-- ✅ Main Content -->
    <ChartView />
  </div>
</template>

<style>
/* ✅ Default theme (Light mode) */
:root {
  --primary-color: rgb(0, 210, 2);
  --background-color: #ffffff;
  --text-color: #222;
}

/* ✅ Dark mode styles */
.app-dark {
  --primary-color: rgb(0, 210, 2);
  --background-color: #111;
  --text-color: #ddd;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}
</style>
