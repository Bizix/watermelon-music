<script setup>
import { ref, provide, onMounted, watch } from "vue";
import { supabase } from "@/lib/supabaseClient";
import { fetchPlaylists } from "@/api/fetchPlaylists";
import { useDarkMode } from "@/composables/useDarkMode";
import AppHeader from "@/components/AppHeader.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();
const user = ref(null);
const playlists = ref([]); // ✅ Store playlists globally

async function refreshUserState() {
  console.log("🔄 Refreshing user state...");
  const { data: session, error } = await supabase.auth.getSession();
  if (error) console.error("❌ Error fetching session:", error);
  user.value = session?.user || null;

  if (user.value) {
    await loadPlaylists(user.value.id); // ✅ Fetch playlists when user logs in
  }
}

// ✅ Fetch user's playlists from backend
async function loadPlaylists(userId) {
  console.log(`📥 Fetching playlists for user: ${userId}`);
  playlists.value = await fetchPlaylists(userId);
}

onMounted(async () => {
  await refreshUserState();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    console.log("🔄 Global Auth State Changed:", session);
    user.value = session?.user || null;
    
    if (user.value) {
      await loadPlaylists(user.value.id);
    } else {
      playlists.value = []; // Clear playlists when user logs out
    }
  });
});

provide("user", user);
provide("playlists", playlists); // ✅ Provide playlists
provide("isDarkMode", isDarkMode);
provide("toggleDarkMode", toggleDarkMode);
</script>
//test
<template>
  <div id="app" data-v-app class="min-h-screen flex justify-center relative">
    <!-- This container fills 100vw on small screens and is capped at 60.625rem on larger screens -->
    <div class="w-[100vw] max-w-[60.7rem] mx-auto chart-container pt-3 w-full mx-auto flex flex-col h-screen">
      <AppHeader />
      <router-view />
    </div>
  </div>
</template>
