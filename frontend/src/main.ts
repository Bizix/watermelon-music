import { createApp } from "vue";
import PrimeVue from "primevue/config";
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import 'primeicons/primeicons.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./App.vue";
import "./output.css";


const CustomPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "rgb(230, 255, 230)",
      100: "rgb(200, 255, 200)",
      200: "rgb(150, 255, 150)",
      300: "rgb(100, 255, 100)",
      400: "rgb(50, 255, 50)",
      500: "rgb(0, 210, 2)", // ✅ Main color
      600: "rgb(0, 180, 2)",
      700: "rgb(0, 150, 2)",
      800: "rgb(0, 120, 2)",
      900: "rgb(0, 90, 2)",
      950: "rgb(0, 60, 2)",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "{gray.50}",
          100: "{gray.100}",
          200: "{gray.200}",
          300: "{gray.300}",
          400: "{gray.400}",
          500: "{gray.500}",
          600: "{gray.600}",
          700: "{gray.700}",
          800: "{gray.800}",
          900: "{gray.900}",
        },
      },
      dark: {
        surface: {
          0: "#000000",
          50: "{gray.900}",
          100: "{gray.800}",
          200: "{gray.700}",
          300: "{gray.600}",
          400: "{gray.500}",
          500: "{gray.400}",
          600: "{gray.300}",
          700: "{gray.200}",
          800: "{gray.100}",
          900: "{gray.50}",
        },
      },
    },
  },
});

const app = createApp(App);

// ✅ Initialize PrimeVue with the theme
app.use(PrimeVue, {
  theme: {
    preset: CustomPreset,
    options: {
      cssLayer: {
        name: "primevue",
        order: "tailwind, primevue", // ✅ PrimeVue applies AFTER Tailwind
    },
      darkModeSelector: ".app-dark", // ✅ Dark mode toggle
    },
  },
});

app.mount("#app");
