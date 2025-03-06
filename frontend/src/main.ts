import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura"; // ✅ Choose a PrimeUIX theme
import 'primeicons/primeicons.css';
import "@fortawesome/fontawesome-free/css/all.min.css";



import "./output.css";
import './style.css'

import App from "./App.vue";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura, // ✅ Set the theme preset
  },
});

app.mount("#app");


