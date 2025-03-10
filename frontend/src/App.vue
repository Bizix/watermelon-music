<script setup>
import { ref, provide, onMounted } from "vue";
import ChartView from "@/views/ChartView.vue";

// ✅ Reactive dark mode state
const isDarkMode = ref(false);

// ✅ Toggle function
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("app-dark", isDarkMode.value);
  localStorage.setItem("theme", isDarkMode.value ? "dark" : "light");
};

// ✅ Retrieve stored preference
onMounted(() => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark") {
    isDarkMode.value = true;
    document.documentElement.classList.add("app-dark");
  }
});

// ✅ Provide dark mode state & function to all components
provide("isDarkMode", isDarkMode);
provide("toggleDarkMode", toggleDarkMode);
</script>

<template>
  <div class="relative min-h-screen">
    <ChartView />
  </div>
</template>


<style>
body {
  background-color: var(--p-surface-0);
  color: var(--p-text-primary);
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}
</style>