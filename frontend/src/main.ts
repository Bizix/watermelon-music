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
      500: "rgb(0, 210, 2)", // ✅ Bright Green
      600: "rgb(0, 180, 2)",
      700: "rgb(0, 150, 2)",
      800: "rgb(0, 120, 2)",
      900: "rgb(0, 90, 2)",
      950: "rgb(0, 60, 2)",
    },
    colorScheme: {
      light: {
        surface: {
          0: "rgb(255, 255, 255)", // ✅ White Background
          50: "rgb(240, 240, 240)",
          100: "rgb(230, 230, 230)",
          200: "rgb(220, 220, 220)", // ✅ Light Gray Borders
          300: "rgb(210, 210, 210)",
          400: "rgb(200, 200, 200)",
          500: "rgb(190, 190, 190)",
          600: "rgb(180, 180, 180)",
          700: "rgb(170, 170, 170)",
          800: "rgb(160, 160, 160)",
          900: "rgb(150, 150, 150)",
        },
        text: {
          primary: "rgb(30, 30, 30)", // ✅ Almost Black Text
        },
        primaryKey: {
          color: "rgb(0, 210, 2)", // ✅ Bright Green Key Color
        },
        secondary: {
          color: "rgb(0, 180, 150)", // ✅ Teal Buttons & Highlights
        },
        accent: {
          color: "rgb(210, 0, 150)", // ✅ Deep Magenta CTA & Alerts
        },
        border: {
          color: "rgb(220, 220, 220)", // ✅ Light Gray Borders
        },
        success: {
          color: "rgb(150, 255, 0)", // ✅ Lime Success
        },
        error: {
          color: "rgb(255, 80, 80)", // ✅ Soft Red Error
        },
      },
      dark: {
        surface: {
          0: "rgb(20, 20, 20)", // ✅ Almost Black Background
          50: "rgb(40, 40, 40)", // ✅ Dark Gray Borders
          100: "rgb(50, 50, 50)",
          200: "rgb(60, 60, 60)",
          300: "rgb(70, 70, 70)",
          400: "rgb(80, 80, 80)",
          500: "rgb(90, 90, 90)",
          600: "rgb(100, 100, 100)",
          700: "rgb(110, 110, 110)",
          800: "rgb(120, 120, 120)",
          900: "rgb(130, 130, 130)",
        },
        text: {
          primary: "rgb(230, 230, 230)", // ✅ Soft White Text
        },
        primaryKey: {
          color: "rgb(0, 210, 2)", // ✅ Bright Green Key Color
        },
        secondary: {
          color: "rgb(0, 180, 150)", // ✅ Teal Buttons & Highlights
        },
        accent: {
          color: "rgb(210, 0, 150)", // ✅ Deep Magenta CTA & Alerts
        },
        border: {
          color: "rgb(40, 40, 40)", // ✅ Dark Gray Borders
        },
        success: {
          color: "rgb(150, 255, 0)", // ✅ Lime Success
        },
        error: {
          color: "rgb(255, 80, 80)", // ✅ Soft Red Error
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
