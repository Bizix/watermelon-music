<!-- <template>
  <button @click="toggleDarkMode" class="theme-toggle">
    <i class="pi" :class="isDarkMode ? 'pi-moon' : 'pi-sun'"></i>
  </button>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  setup() {
    const isDarkMode = ref(false);

    // ✅ Check user's preference
    onMounted(() => {
      isDarkMode.value = document.documentElement.classList.contains("app-dark");
    });

    const toggleDarkMode = () => {
      document.documentElement.classList.toggle("app-dark");
      isDarkMode.value = !isDarkMode.value;
    };

    return { isDarkMode, toggleDarkMode };
  },
};
</script>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 42px; /* ✅ Set width */
  height: 42px; /* ✅ Set height */
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-size: 1.4rem;
  background-color: var(--p-primary-500);
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
}

.theme-toggle:hover {
  background-color: var(--p-primary-600);
}

.theme-toggle i {
  line-height: 1; /* ✅ Ensure proper centering */
}
</style> -->
