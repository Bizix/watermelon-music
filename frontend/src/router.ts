import { createRouter, createWebHistory } from "vue-router";

import ChartView from "@/views/ChartView.vue";
import PlaylistsView from "@/views/ChartView.vue";

// import Goodbye from "@/views/Goodbye.vue"; // Page after account deletion

const routes = [
  { path: "/", component: ChartView },
  // { path: "/playlists", component: PlaylistsView },
  // { path: "/goodbye", component: Goodbye },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
