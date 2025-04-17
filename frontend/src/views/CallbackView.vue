<!-- views/CallbackView.vue -->
<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state || "/";

  if (!code) return router.replace("/");

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spotify/callback?code=${code}&state=${state}`);
    if (response.ok) {
      // 🚀 redirect user back to their original path
      router.replace(state);
    } else {
      console.error("Spotify callback failed");
      router.replace("/");
    }
  } catch (err) {
    console.error("Spotify callback error:", err);
    router.replace("/");
  }
});
</script>

<template>
  <div class="flex justify-center items-center h-full">
    <p>Connecting your Spotify account...</p>
  </div>
</template>
