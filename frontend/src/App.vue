<template>
  <div id="app" data-v-app class="min-h-[100dvh] overflow-x-hidden">
    <div class="mx-auto flex min-h-[100dvh] w-full max-w-[60.7rem] flex-col px-3 pb-4 pt-3 sm:px-4 lg:px-6">
      <AppHeader class="shrink-0" />
      <main class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-black/5 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <router-view :key="$route.fullPath" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, provide, ref } from "vue";
import { supabase } from "@/lib/supabaseClient";
import { fetchPlaylists } from "@/api/fetchPlaylists";
import { useDarkMode } from "@/composables/useDarkMode";
import AppHeader from "@/components/AppHeader.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();
const user = ref(null);
const accessToken = ref(null);
const playlists = ref([]);
const isSpotifyConnected = ref(false);

let authSubscription = null;
let refreshPromise = null;

async function refreshUserState() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error fetching session:", error);
      return;
    }

    user.value = session?.user ?? null;
    accessToken.value = session?.access_token ?? null;

    if (!user.value) {
      playlists.value = [];
      isSpotifyConnected.value = false;
      return;
    }

    const [playlistResult, spotifyStatusResult] = await Promise.allSettled([
      fetchPlaylists(),
      supabase
        .from("users")
        .select("is_spotify_connected")
        .eq("id", user.value.id)
        .maybeSingle(),
    ]);

    playlists.value =
      playlistResult.status === "fulfilled" ? playlistResult.value : [];

    if (spotifyStatusResult.status === "fulfilled") {
      isSpotifyConnected.value = !!spotifyStatusResult.value.data?.is_spotify_connected;
    } else {
      isSpotifyConnected.value = false;
      console.error("Error fetching Spotify connection state:", spotifyStatusResult.reason);
    }
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function handleFocus() {
  refreshUserState();
}

function onVisibilityChange() {
  if (!document.hidden) {
    refreshUserState();
  }
}

onMounted(() => {
  refreshUserState();

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", onVisibilityChange);

  authSubscription = supabase.auth.onAuthStateChange((_, session) => {
    user.value = session?.user ?? null;
    accessToken.value = session?.access_token ?? null;
    refreshUserState();
  });
});

onUnmounted(() => {
  window.removeEventListener("focus", handleFocus);
  document.removeEventListener("visibilitychange", onVisibilityChange);

  const subscription = authSubscription?.data?.subscription;
  if (subscription && typeof subscription.unsubscribe === "function") {
    subscription.unsubscribe();
  }
});

provide("user", user);
provide("accessToken", accessToken);
provide("playlists", playlists);
provide("isSpotifyConnected", isSpotifyConnected);
provide("isDarkMode", isDarkMode);
provide("toggleDarkMode", toggleDarkMode);
</script>
