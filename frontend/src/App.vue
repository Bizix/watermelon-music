<script setup>
import { ref, provide, onMounted } from "vue";
import { supabase } from "@/lib/supabaseClient";

import { useDarkMode } from "@/composables/useDarkMode";
import AppHeader from "@/components/AppHeader.vue";
import ChartView from "@/views/ChartView.vue";

const { isDarkMode, toggleDarkMode } = useDarkMode();

const user = ref(null);

async function refreshUserState() {
  console.log("🔄 Refreshing user state...");
  const { data: session, error } = await supabase.auth.getSession();
  if (error) console.error("Error fetching session:", error);
  user.value = session?.user || null;
}

onMounted(async () => {
    await refreshUserState(); // 🔄 Fetch session on mount

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Global Auth State Changed:", session);
      user.value = session?.user || null; // ✅ Ensures reactivity
    });
  });
  provide("user", user);
  provide("isDarkMode", isDarkMode);
  provide("toggleDarkMode", toggleDarkMode);

</script>

<template>
  <div class="relative min-h-screen">
    <div class="chart-container pt-3 w-full mx-auto flex flex-col h-screen transition-colors">
      <AppHeader />
      <router-view />
    </div>
  </div>
</template>
