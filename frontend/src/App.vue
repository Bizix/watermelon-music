<template>
  <div id="app" data-v-app class="min-h-screen flex justify-center relative">
    <div class="w-[100vw] max-w-[60.7rem] mx-auto chart-container pt-3 w-full flex flex-col h-screen">
      <AppHeader />
      <!-- keep this keyed so it remounts when auth & route change -->
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from "vue";
import { supabase } from "@/lib/supabaseClient";
import { fetchPlaylists } from "@/api/fetchPlaylists";
import { useDarkMode } from "@/composables/useDarkMode";
import AppHeader from "@/components/AppHeader.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();
const user      = ref(null);
const playlists = ref([]);
const isSpotifyConnected = ref(false);

// fetch user & playlists
async function refreshUserState() {
  console.log("🔄 Refreshing user state...");

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("❌ Error fetching session:", error);
    return;
  }

  user.value = session?.user ?? null;

  if (user.value) {
    // ✅ Fetch additional Spotify connection status from `users` table
    const { data, error: userTableError } = await supabase
    .from("users")
    .select("is_spotify_connected")
    .eq("id", user.value.id)
    .maybeSingle();

      if (userTableError) {
      console.warn("⚠️ Failed to fetch user Spotify status:", userTableError.message);
      } else if (!data) {
        console.warn("⚠️ No row found in users table for:", user.value.id);
      } else {
        isSpotifyConnected.value = !!data.is_spotify_connected;
        console.log("🎧 isSpotifyConnected:", isSpotifyConnected.value);
      }

    // Also update playlists if needed
    playlists.value = await fetchPlaylists(user.value.id);
  } else {
    playlists.value = [];
  }
}

let authSubscription;
function onVisibilityChange() {
  if (!document.hidden) {
    // page became visible → rehydrate session
    refreshUserState();
  }
}

onMounted(() => {
  // 1) initial load
  refreshUserState();

  // 2) rehydrate on tab focus / visibility change
  window.addEventListener("focus", refreshUserState);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // 3) keep in sync with Supabase auth events
  authSubscription = supabase.auth.onAuthStateChange((_, session) => {
    user.value = session?.user ?? null;
    if (user.value) {
      fetchPlaylists(user.value.id).then(pl => playlists.value = pl);
    } else {
      playlists.value = [];
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("focus", refreshUserState);
  document.removeEventListener("visibilitychange", onVisibilityChange);

  // clean up Supabase listener
  if (authSubscription && typeof authSubscription.subscription?.unsubscribe === "function") {
    authSubscription.subscription.unsubscribe();
  }
});

// provide globally
provide("user", user);
provide("playlists", playlists);
provide("isSpotifyConnected", isSpotifyConnected);
provide("isDarkMode", isDarkMode);
provide("toggleDarkMode", toggleDarkMode);
</script>
