<template>
  <div class="song-card w-full flex flex-col p-4 shadow-lg border-t transition-colors"  :data-id="song.id" :data-song-id="song.melon_song_id">
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
              <button v-if="user" @click="togglePlaylistMenu($event)"
                 class="text-slg font-medium rounded-lg cursor-pointer transition-colors 
                 text-[var(--p-primary-color)] hover:text-[var(--p-primary-400)]">
              +
              </button>
              <!-- ✅ Playlist Dropdown -->
              <div ref="playlistMenuRef" 
                v-if="showPlaylistMenu" 
                class="absolute right-0 mt-2 w-48 shadow-lg rounded-lg z-50 overflow-y-auto max-h-64 scrollbar-hidden"
                 :class="{
                 'bg-[var(--p-surface-50)] text-black': !isDarkMode,
                 'bg-[var(--p-surface-100)] text-white': isDarkMode
                 }">
                   <!-- ✅ Scroll Indicator -->
                  <ScrollIndicator v-if="!isLoading" :showScrollIndicator="showScrollIndicator" />
                 <button @click="toggleNewPlaylistInput" class="w-full text-center px-3 py-2 text-xs font-medium hover:bg-gray-100 rounded-t-lg"
                    :class="{
                    'hover:bg-gray-300': !isDarkMode,
                    'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
                    }">
                 Add to new playlist
                 </button>
                 <!-- ✅ New Playlist Input -->
                 <div v-if="showNewPlaylistInput">
                    <input
                       id="new-playlist-name"
                       name="newPlaylistName"
                       v-model="newPlaylistName" 
                       type="text" 
                       placeholder="Playlist name..."
                       autocomplete="off"
                       class="w-full px-2 py-1 text-sm border-none outline-none focus:ring-0 focus:border-transparent"
                       >
                    <button 
                       @click="handleCreatePlaylist"
                       :disabled="!newPlaylistName.trim()"
                       class="w-full px-2 py-1 text-sm font-medium cursor-pointer text-white transition-colors"
                       :class="{
                       'bg-green-500 hover:bg-green-600': newPlaylistName.trim(), // ✅ Enabled state
                       'bg-gray-300 cursor-not-allowed': !newPlaylistName.trim() // ✅ Disabled state
                       }"
                       >
                    Create
                    </button>
                 </div>
                 <!-- ✅ Existing Playlists -->
                 <p v-if="playlists.length === 0" class="text-xs text-center text-gray-500 px-2 py-1">No playlists found.</p>
                 <div class="w-48 shadow-lg z-50 rounded-b-lg pb"
                      :class="{
                      'bg-[var(--p-surface-50)] text-black': !isDarkMode,
                      'bg-[var(--p-surface-100)] text-white': isDarkMode}">
                    <div 
                      v-for="(playlist, index) in playlists" 
                      :data-playlist-id="playlist.id" 
                      class="text-xs font-medium flex items-center justify-between px-1 py-1 pl-2 border-t border-gray-400"             
                       >
                       <span class="text-sm px-">{{ playlist.name }}</span>
                       <button 
                        @click="playlist.songs.includes(song.id) ? handleRemoveSong(playlist.id) : handleAddSong(playlist.id)"
                        :class="[
                          'text-sm px-3 py-2 rounded',
                          playlist.songs.includes(song.id)
                            ? 'bg-red-700 hover:bg-red-800'
                            : 'text-white bg-[var(--p-primary-500)] hover:bg-[var(--p-primary-400)]'
                        ]">
                        {{ playlist.songs.includes(song.id) ? "−" : "+" }}
                      </button>
                    </div>
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
import { ref, watchEffect, inject, onMounted, onUnmounted } from "vue";
import { supabase } from "@/lib/supabaseClient"; 
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { usePlaylist } from "@/composables/usePlaylist";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";
import { API_BASE_URL } from "../config";


export default {
  props: {
    song: {
      type: Object,
      required: true
    }
  },
  components: {
    LoadingSpinner,
    ScrollIndicator
  },
  setup(props) {
    const isExpanded = ref(false);
    const lyrics = ref(null);
    const isLoading = ref(false);
    const isDarkMode = inject("isDarkMode");
    const playlists = inject("playlists");
    const playlistDropdownRef = ref(null);

    const {  fetchPlaylists, createPlaylist, addToPlaylist, removeFromPlaylist } = usePlaylist();
    const user = inject("user");
    const showPlaylistMenu = ref(false);
    const showNewPlaylistInput = ref(false);
    const newPlaylistName = ref("");
    const playlistMenuRef = ref(null);
    const { showScrollIndicator, checkScroll } = useScrollIndicator(playlistMenuRef);


  
    function closeMenuOnOutsideClick(event) {
      setTimeout(() => {
        if (playlistMenuRef.value && !playlistMenuRef.value.contains(event.target)) {
          showPlaylistMenu.value = false;
          showNewPlaylistInput.value = false;
        }
      }, 100); // 🔥 Allows Vue to update first before checking
    }
    
    onMounted(() => {
      document.addEventListener("click", closeMenuOnOutsideClick);

        // ✅ Attach scroll event to playlist dropdown
        if (playlistMenuRef.value) {
          playlistMenuRef.value.addEventListener("scroll", checkScroll);
        }
    });

    onUnmounted(() => {
      document.removeEventListener("click", closeMenuOnOutsideClick);

        // ✅ Clean up scroll listener
        if (playlistMenuRef.value) {
          playlistMenuRef.value.removeEventListener("scroll", checkScroll);
        }
    });

    // ✅ Get logged-in user state
    async function fetchUser() {
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      user.value = session.user;
      await fetchPlaylists(); // ✅ Fetch playlists after user state is set
    }
  }
    fetchUser();

    // ✅ Handle Creating a New Playlist
    async function handleCreatePlaylist() {
      if (!newPlaylistName.value || !newPlaylistName.value.trim()) {
        console.error("🚨 Playlist name is empty!");
        return;
      }

      const newPlaylist = await createPlaylist(user.value.id, newPlaylistName.value);

      if (newPlaylist) {
        newPlaylistName.value = "";
        showNewPlaylistInput.value = false;

        // ✅ Ensure `songs` is an array before modifying it
        newPlaylist.songs = Array.isArray(newPlaylist.songs) ? newPlaylist.songs : [];

        // ✅ Immediately add the selected song (using `song.id`) to the new playlist
        const success = await addToPlaylist(newPlaylist.id, props.song.id);

        if (success) {
          console.log(`🎵 Added song ${props.song.id} to playlist ${newPlaylist.id}`);
          newPlaylist.songs.push(props.song.id); // ✅ Update UI
        }

        // ✅ Add the new playlist to the UI at the top
        playlists.value.unshift(newPlaylist);
      }
    }


    // ✅ Handle Adding a Song
    async function handleAddSong(playlistId) {
      const success = await addToPlaylist(playlistId, props.song.id);
      
      if (success) {
        // ✅ Update the UI immediately
        const playlist = playlists.value.find(p => p.id === playlistId);
        if (playlist) {
          playlist.songs.push(props.song.id);
        }
      }
    }

    // ✅ Handle Removing a Song
    async function handleRemoveSong(playlistId) {
      const success = await removeFromPlaylist(playlistId, props.song.id);

      if (success) {
        // ✅ Update the UI immediately
        const playlist = playlists.value.find(p => p.id === playlistId);
        if (playlist) {
          playlist.songs = playlist.songs.filter(songId => songId !== props.song.id);
        }
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

  // ✅ Toggle "Add to new playlist" input
  function toggleNewPlaylistInput() {
    if (!showPlaylistMenu.value) {
      showPlaylistMenu.value = true; // ✅ Ensure the dropdown is open before toggling input
    }
    showNewPlaylistInput.value = !showNewPlaylistInput.value; // ✅ Toggle input
  }


    function togglePlaylistMenu(event) {
      event.stopPropagation(); // ✅ Prevents event bubbling
      if (showPlaylistMenu.value) {
        showNewPlaylistInput.value = false; // 🔥 Hide input when closing
      }
      showPlaylistMenu.value = !showPlaylistMenu.value;
    }

    async function fetchLyrics() {
      if (lyrics.value || isLoading.value) return;

        // ✅ Use cached lyrics if available
        if (props.song.lyrics) {
          lyrics.value = props.song.lyrics;
          return;
        }

      console.log("🔄 Fetching Lyrics - Loading Starts");
      isLoading.value = true;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/lyrics?title=${encodeURIComponent(props.song.title)}&artist=${encodeURIComponent(props.song.artist)}&songId=${props.song.melon_song_id}`
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
      if (isExpanded.value && !lyrics.value) fetchLyrics();   
     };

    const actionButtons = [
      props.song.youtube_url && { 
        url: `https://www.youtube.com/watch?v=${props.song.youtube_url}`, 
        icon: "pi pi-youtube", 
        color: "text-red-500 hover:text-red-600" 
      },
      props.song.apple_music_url && { 
        url: props.song.apple_music_url, 
        icon: "pi pi-apple", 
        color: "text-gray-300 hover:text-gray-400" 
      },
      props.song.spotify_url && { 
        url: `https://open.spotify.com/track/${props.song.spotify_url}`, 
        icon: "fab fa-spotify", 
        color: "text-green-400 hover:text-green-500" 
      }
    ].filter(Boolean); // Removes any null/false values from the array



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
      togglePlaylistMenu,
      playlistMenuRef,
      closeMenuOnOutsideClick,
      isDarkMode,
      toggleNewPlaylistInput,
      handleCreatePlaylist,
      handleRemoveSong,
      handleAddSong,
      showScrollIndicator
    };
  }
};
</script>
