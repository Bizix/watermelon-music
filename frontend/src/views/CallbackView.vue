<!-- views/CallbackView.vue -->
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  // optional fallback, just in case user lands here by accident
  setTimeout(() => {
    router.replace("/playlists");
  }, 2000);
});
</script>

<template>
  <div class="flex justify-center items-center h-full">
    <p>Connecting your Spotify account...</p>
  </div>
</template>
