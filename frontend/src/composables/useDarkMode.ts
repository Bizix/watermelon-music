import { ref, onMounted, provide } from "vue";

export function useDarkMode() {
  const isDarkMode = ref(false);

  const toggleDarkMode = async () => {
    isDarkMode.value = !isDarkMode.value;

    document.documentElement.classList.toggle("app-dark", isDarkMode.value);
    localStorage.setItem("theme", isDarkMode.value ? "dark" : "light");
  };

  onMounted(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      isDarkMode.value = true;
      document.documentElement.classList.add("app-dark");
    }
  });

  provide("isDarkMode", isDarkMode);
  provide("toggleDarkMode", toggleDarkMode);

  return { isDarkMode, toggleDarkMode };
}
