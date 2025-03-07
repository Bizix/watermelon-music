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

// ✅ Provide dark mode state to all components
provide("isDarkMode", isDarkMode);
</script>

<template>
  <div class="relative min-h-screen">
    <!-- ✅ Theme Toggle Button -->
    <button
      @click="toggleDarkMode"
      class="absolute top-4 right-4 px-4 py-2 rounded-lg transition-all duration-300"
      :class="{
        'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode, // ✅ Fades slightly on hover
        'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode       // ✅ Correct dark mode colors
      }"
    >
      <i v-if="isDarkMode" class="pi pi-moon"></i>
      <i v-else class="pi pi-sun"></i>
    </button>

    <!-- ✅ Main Content -->
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