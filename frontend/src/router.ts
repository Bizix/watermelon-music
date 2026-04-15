import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "./lib/supabaseClient";

const routes = [
  {
    path: "/",
    name: "Charts",
    component: () => import("@/views/ChartView.vue"),
  },
  {
    path: "/playlists",
    name: "Playlists",
    component: () => import("@/views/PlaylistsView.vue"),
    meta: { requiresAuth: true },
  },
  { 
    path: "/callback", 
    name: "SpotifyCallback",
    component: () => import("@/views/CallbackView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
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
