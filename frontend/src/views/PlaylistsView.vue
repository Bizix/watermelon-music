<script setup>
import { ref, onMounted } from "vue";
import { usePlaylist } from "@/composables/usePlaylist";
import { supabase } from "@/lib/supabaseClient";
import { usePlaylist } from "@/composables/usePlaylist";

const playlists = inject("playlists"); // ✅ Inject playlists from App.vue
const { fetchPlaylists, createPlaylist, addToPlaylist, removeFromPlaylist } = usePlaylist();

const user = ref(null);
const newPlaylistName = ref("");

async function fetchUser() {
  const { data: session } = await supabase.auth.getSession();
  user.value = session?.user || null;
  if (user.value) fetchPlaylists(user.value.id);
}
fetchUser();

async function handleCreatePlaylist() {
  const newPlaylist = await createPlaylist(user.value.id, newPlaylistName.value);
  if (newPlaylist) {
    newPlaylistName.value = "";
  }
}
</script>

<template>
  <div>
    <h2>My Playlists</h2>

    <input v-model="newPlaylistName" placeholder="New Playlist Name">
    <button @click="handleCreatePlaylist">Create Playlist</button>

    <ul>
      <li v-for="playlist in playlists" :key="playlist.id">
        {{ playlist.name }}
        <button @click="addToPlaylist(playlist.id, 42)">+ Add Song</button>
        <button @click="removeFromPlaylist(playlist.id, 42)">- Remove Song</button>
      </li>
    </ul>
  </div>
</template>
