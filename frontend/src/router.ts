import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "./lib/supabaseClient";

import ChartView from "@/views/ChartView.vue";
import PlaylistsView from "@/views/PlaylistsView.vue";
import CallbackView from "@/views/CallbackView.vue";

const routes = [
  {
    path: "/",
    name: "Charts",
    component: ChartView,
  },
  {
    path: "/playlists",
    name: "Playlists",
    component: PlaylistsView,
    meta: { requiresAuth: true },
  },
  { 
    path: "/callback", 
    name: "SpotifyCallback",
    component: CallbackView 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global navigation guard to check authentication
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    // Use Supabase to check if a session exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Redirect if not logged in. You could also redirect to a dedicated login page.
      next({ path: "/" });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
