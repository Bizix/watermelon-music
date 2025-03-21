import { createRouter, createWebHistory } from "vue-router";

import ChartView from "@/views/ChartView.vue";
import PlaylistsView from "@/views/PlaylistsView.vue";

const routes = [
  { path: "/", component: ChartView },
  { path: "/playlists", component: PlaylistsView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;