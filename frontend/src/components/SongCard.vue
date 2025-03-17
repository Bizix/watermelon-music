<template>
  <div class="song-card w-full flex flex-col p-4 shadow-lg border-t transition-colors" :data-song-id="song.melon_song_id">
      
    <div class="flex items-center gap-4 w-full">
      <!-- ✅ Rank with Movement -->
      <div class="flex items-center min-w-[50px] justify-center gap-1">
        <span class="font-bold text-lg text-primary-500 pr-1">
          {{ song.rank }}
        </span>
        <span class="flex items-end text-sm gap-0.5" :class="{
          'text-green-500 font-bold uppercase text-xs': song.movement === 'NEW',  // ✅ Style NEW in green & uppercase
          'text-green-500': song.movement.includes('↑'),
          'text-red-500': song.movement.includes('↓'),
          'text-gray-500': song.movement === '-'
        }">
          <span v-if="song.movement === 'NEW'">NEW</span>
          <template v-else>
            <span class="text-base leading-none">{{ song.movement.charAt(0) }}</span>
            <span class="text-xs leading-none">{{ song.movement.slice(1) }}</span>
          </template>
        </span>

      </div>
      <!-- ✅ Album Art -->
      <img 
        :src="song.art" 
        :alt="song.album"
        class="w-16 h-16 rounded-md object-cover border border-surface-400"
      />

      <!-- ✅ Song Info -->
      <div class="flex flex-col flex-grow">
        <p class="text-lg font-semibold text-surface-900">{{ song.title }}</p>
        <p class="text-lg text-surface-800">{{ song.artist }}</p>
        <p class="text-sm italic text-surface-600">{{ song.album }}</p>
      </div>

      <!-- ✅ Action Buttons -->
      <div class="flex items-center gap-3">
        <template v-for="(button, index) in actionButtons" :key="index">
          <a
            v-if="button.url"
            :href="button.url"
            target="_blank"
            class="text-xl"
            :class="button.color"
          >
            <i :class="button.icon"></i>
          </a>
        </template>

        <!-- ✅ Lyrics Button -->
        <button @click="toggleExpand"
          class="px-3 py-1 text-sm font-medium rounded-lg cursor-pointer transition-colors 
                bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]">
          Lyrics
        </button>

      <!-- ✅ Action Buttons -->
      <div class="relative">
        <!-- ✅ Add to Playlist Button -->
        <button v-if="user" @click="togglePlaylistMenu"
          class="px-3 py-1 text-sm font-medium rounded-lg cursor-pointer transition-colors 
                bg-green-500 text-white hover:bg-green-600">
          + Add to Playlist
        </button>

        <!-- ✅ Playlist Dropdown -->
        <div v-if="showPlaylistMenu" class="absolute right-0 mt-2 w-48 bg-white shadow-lg border rounded-lg p-2 z-50">
          <button @click="showNewPlaylistInput = true" class="w-full text-left px-2 py-1 text-sm font-medium hover:bg-gray-100 rounded">
            ➕ Add to new playlist
          </button>

          <!-- ✅ New Playlist Input -->
          <div v-if="showNewPlaylistInput" class="mt-2">
            <input v-model="newPlaylistName" type="text" placeholder="Playlist name..."
              class="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-green-500">
            <button @click="createPlaylist" class="mt-1 w-full px-2 py-1 text-sm font-medium bg-green-500 text-white rounded-lg">
              Create
            </button>
          </div>

          <!-- ✅ Existing Playlists -->
          <p v-if="playlists.length === 0" class="text-xs text-center text-gray-500 mt-2">No playlists found.</p>
          <div v-for="playlist in playlists" :key="playlist.id" class="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded">
            <span class="text-sm">{{ playlist.name }}</span>
            <button @click="toggleSongInPlaylist(playlist.id)"
              class="text-sm px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300">
              {{ playlist.songs.includes(song.melon_song_id) ? "−" : "+" }}
            </button>
          </div>
          </div>
          </div>

      </div>
    </div>

    <!-- ✅ Expanded Lyrics Section -->
    <transition name="fade">
      <div v-if="isExpanded" class="mt-3 p-3 text-center border-t w-full bg-surface-200 border-surface-300">
      
        <!-- ✅ Show Spinner While Loading -->
        <div v-if="isLoading" class="flex flex-grow pt-3 items-center justify-center">
          <LoadingSpinner :isLoading="true" message="Loading lyrics..." size="w-10 h-10" color="fill-green-500" />
        </div>

        <!-- ✅ Display Lyrics -->
        <p v-else-if="lyrics" class="whitespace-pre-line pt-3 text-surface-700">{{ lyrics }}</p>

        <!-- ✅ Error Message -->
        <p v-else class="italic text-surface-700 pt-3">❌ Lyrics not found.</p>

      </div>
    </transition>
  </div>
</template>

<script>
import { ref, watchEffect, inject } from "vue";
import { supabase } from "@/lib/supabaseClient"; 
import LoadingSpinner from "@/components/LoadingSpinner.vue";

export default {
  props: {
    song: {
      type: Object,
      required: true
    }
  },
  components: {
    LoadingSpinner
  },
  setup(props) {
    const isExpanded = ref(false);
    const lyrics = ref(null);
    const isLoading = ref(false);


    // TODO START
    const user = inject("user");
    const playlists = ref([]);
    const showPlaylistMenu = ref(false);
    const showNewPlaylistInput = ref(false);
    const newPlaylistName = ref("");

    // ✅ Get logged-in user state
    async function fetchUser() {
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      user.value = session.user;
      await fetchPlaylists(); // ✅ Fetch playlists after user state is set
    }
  }
    fetchUser();

    async function fetchPlaylists() {
      if (!user.value) return;
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, songs")
        .eq("user_id", user.value.id);

      if (!error) playlists.value = data || [];
    }

  async function createPlaylist() {
    if (!user.value || !newPlaylistName.value.trim()) return;

    const { data, error } = await supabase
      .from("playlists")
      .insert([{ user_id: user.value.id, name: newPlaylistName.value.trim(), songs: [] }])
      .select()
      .single();

    if (!error && data) {
      playlists.value.push(data);
      newPlaylistName.value = "";
      showNewPlaylistInput.value = false;
    }
  }

  async function toggleSongInPlaylist(playlistId) {
    const playlist = playlists.value.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedSongs = playlist.songs.includes(props.song.melon_song_id)
      ? playlist.songs.filter(songId => songId !== props.song.melon_song_id)
      : [...playlist.songs, props.song.melon_song_id];

    const { error } = await supabase
      .from("playlists")
      .update({ songs: updatedSongs })
      .eq("id", playlistId);

    if (!error) {
      playlist.songs = updatedSongs;
    }
  }

  function togglePlaylistMenu() {
    showPlaylistMenu.value = !showPlaylistMenu.value;
  }

  // TODO END

    async function fetchLyrics() {
      if (lyrics.value || isLoading.value) return;

      console.log("🔄 Fetching Lyrics - Loading Starts");
      isLoading.value = true;

      try {
        const response = await fetch(
          `http://localhost:5000/api/lyrics?title=${encodeURIComponent(props.song.title)}&artist=${encodeURIComponent(props.song.artist)}&songId=${props.song.melon_song_id}`
        );

        const data = await response.json();
        if (response.ok && data.lyrics) {
          lyrics.value = data.lyrics;
        } else {
          console.error("❌ No lyrics found:", data.error);
        }
      } catch (error) {
        console.error("❌ Failed to fetch lyrics:", error);
      } finally {
        console.log("✅ Fetching Lyrics - Loading Ends");
        isLoading.value = false;
      }
    }

    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
      if (isExpanded.value) fetchLyrics();
    };

    const actionButtons = [
      { url: `https://www.youtube.com/watch?v=${props.song.youtube_url}`, icon: "pi pi-youtube", color: "text-red-500 hover:text-red-600" },
      { url: props.song.apple_music_url, icon: "pi pi-apple", color: "text-gray-300 hover:text-gray-400" },
      { url: `https://open.spotify.com/track/${props.song.spotify_url}`, icon: "fab fa-spotify", color: "text-green-400 hover:text-green-500" }
    ];

    return {
      isExpanded,
      lyrics,
      isLoading,
      toggleExpand,
      actionButtons,
      user,
      playlists,
      showPlaylistMenu,
      showNewPlaylistInput,
      newPlaylistName,
      fetchUser,
      fetchPlaylists,
      createPlaylist,
      toggleSongInPlaylist,
      togglePlaylistMenu
    };
  }
};
</script>
