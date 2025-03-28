import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "./lib/supabaseClient";


import ChartView from "@/views/ChartView.vue";
import PlaylistsView from "@/views/PlaylistsView.vue";

const routes = [
  { path: "/", component: ChartView },
  { path: "/playlists", component: PlaylistsView, meta: { requiresAuth: true }  },
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