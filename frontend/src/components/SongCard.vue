<template>
  <div class="song-card w-full flex flex-col p-4 shadow-lg border-t"
    :data-id="song.id" :data-song-id="song.melon_song_id">
    <div class="flex items-center sm:gap-4 w-full">
      <!-- ✅ Rank with Movement -->
      <div class="flex items-center sm:min-w-[30px] justify-center sm:gap-1">
        <span class="font-bold text-lg text-primary-500 pr-1">
          {{ song.rank }}
        </span>
        <span class="flex items-end text-sm gap-0.5" :class="movementClasses">
          <span v-if="song.movement === 'NEW'">
            NEW
          </span>
          <template v-else>
            <span class="text-base leading-none">
              {{ song.movement.charAt(0) }}
            </span>
            <span class="text-xs leading-none">
              {{ song.movement.slice(1) }}
            </span>
          </template>
        </span>
      </div>
      <!-- ✅ Album Art -->
      <img :src="song.art" :alt="song.album" class="w-16 h-16 ml-1 mr-3 sm:m-0 rounded-md object-cover border border-surface-400" />
      <!-- ✅ Song Info -->
      <div class="flex flex-col flex-grow">
        <p class="text-sm sm:text-lg font-semibold text-surface-900">
          {{ song.title }}
        </p>
        <p class="text-sm sm:text-lg text-surface-800">
          {{ song.artist }}
        </p>
        <p class="text-sm italic text-surface-600">
          {{ song.album }}
        </p>
      </div>
      <!-- ✅ Action Buttons -->
      <div class="flex flex-col sm:flex-row items-center sm:gap-3">
        <template v-for="(button, index) in actionButtons" :key="index">
          <a v-if="button.url" :href="button.url" target="_blank" class="text-xl" :class="button.color">
            <i :class="button.icon"></i>
          </a>
        </template>
        <!-- ✅ Lyrics Button -->
        <button @click="toggleExpand" hidden class="px-3 py-1 text-sm font-medium rounded-lg cursor-pointer bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]">
          Lyrics
        </button>
        <div class="relative">
          <!-- ✅ Add to Playlist Button -->
          <button v-if="user" @click="togglePlaylistMenu($event)" class="text-slg font-medium rounded-lg cursor-pointer text-[var(--p-primary-color)] hover:text-[var(--p-primary-400)]">
            +
          </button>
          <!-- Playlist Dropdown Container -->
          <!-- Changed v-show to use the computed property isDropdownOpen -->
          <div ref="playlistContainerRef" v-show="isDropdownOpen" class="absolute right-0 mt-2 w-48 shadow-lg rounded-lg z-50">
            <!-- Inner wrapper remains unchanged -->
            <div class="relative">
              <!-- Always render the scrollable content -->
              <div ref="playlistMenuRef" class="overflow-y-auto max-h-64 scrollbar-hidden rounded-t-lg rounded-b-lg"
                :class="{
                  'bg-[var(--p-surface-50)] text-black': !isDarkMode,
                  'bg-[var(--p-surface-100)] text-white': isDarkMode
                }">
                <button @click.stop="toggleNewPlaylistInput" class="w-full text-center px-3 py-2 text-xs font-medium hover:bg-gray-100 rounded-t-lg"
                  :class="{
                    'hover:bg-gray-300': !isDarkMode,
                    'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
                  }">
                  Add to new playlist
                </button>
                <!-- New Playlist Input -->
                <div v-if="showNewPlaylistInput">
                  <input id="new-playlist-name" name="newPlaylistName" v-model="newPlaylistName"
                    type="text" placeholder="Playlist name..." autocomplete="off"
                    @click.stop
                    class="w-full px-2 py-1 text-sm border-none outline-none focus:ring-0 focus:border-transparent" />

                  <button @click.stop="handleCreatePlaylist" :disabled="!newPlaylistName.trim()"
                    class="w-full px-2 py-1 text-sm font-medium cursor-pointer text-white transition-colors"
                    :class="{
                      'bg-green-500 hover:bg-green-600': newPlaylistName.trim(),
                      'bg-gray-300 cursor-not-allowed': !newPlaylistName.trim()
                    }">
                    Create
                  </button>
                </div>
                <!-- Existing Playlists -->
                <p v-if="playlists.length === 0" class="text-xs text-center text-gray-500 px-2 py-1">
                  No playlists found.
                </p>
                <div class="w-48 shadow-lg z-50 rounded-b-lg" :class="{
                  'bg-[var(--p-surface-50)] text-black': !isDarkMode,
                  'bg-[var(--p-surface-100)] text-white': isDarkMode
                }">
                <div v-for="(playlist, index) in playlists" 
                    :data-playlist-id="playlist.id"
                    class="text-xs font-medium flex items-center justify-between px-1 py-1 pl-2 border-t border-gray-400"
                    :class="{ 'rounded-b-lg': index === playlists.length - 1 }"
                    @click.stop>
                  <span class="text-sm">
                    {{ playlist.name }}
                  </span>
                  <button @click.stop="playlist.songs.includes(song.id) ? handleRemoveSong(playlist.id) : handleAddSong(playlist.id)"
                          :class="[
                            'text-sm px-3 py-2 rounded text-white',
                            playlist.songs.includes(song.id)
                              ? 'bg-red-700 hover:bg-red-800'
                              : 'bg-[var(--p-primary-500)] hover:bg-[var(--p-primary-400)]'
                          ]">
                    {{ playlist.songs.includes(song.id) ? "−" : "+" }}
                  </button>
                </div>
                </div>
              </div>
              <!-- Overlay the spinner on top of the content if loading -->
              <div v-if="isPlaylistLoading" class="absolute inset-0 flex items-center justify-center z-50 bg-[rgba(255,255,255,0.6)] rounded-lg">
                <LoadingSpinner :isLoading="true" message="Loading playlists" size="w-10 h-10"
                  color="fill-green-500" />
              </div>
              <!-- ScrollIndicator remains as before -->
              <ScrollIndicator class="absolute bottom-0 left-0 w-full pointer-events-none"
                v-if="!isPlaylistLoading" :showScrollIndicator="showScrollIndicator" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ✅ Expanded Lyrics Section -->
    <transition name="fade">
      <div v-if="isExpanded" class="mt-3 p-3 text-center border-t w-full bg-surface-200 border-surface-300">
        <div v-if="isLoading" class="flex flex-grow pt-3 items-center justify-center">
          <LoadingSpinner :isLoading="true" message="Loading lyrics..." size="w-10 h-10"
            color="fill-green-500" />
        </div>
        <p v-else-if="lyrics" class="whitespace-pre-line pt-3 text-surface-700">
          {{ lyrics }}
        </p>
        <p v-else class="italic text-surface-700 pt-3">
          ❌ Lyrics not found.
        </p>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, inject, onMounted, onUnmounted, computed } from "vue";
import { supabase } from "@/lib/supabaseClient";
import { usePlaylist } from "@/composables/usePlaylist";
import { fetchLyrics as getLyrics } from "@/api/fetchLyrics";

import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ScrollIndicator from "@/components/ScrollIndicator.vue";
import useScrollIndicator from "@/composables/useScrollIndicator.ts";

export default {
  // Add the new prop for the centralized dropdown state
  props: {
    song: {
      type: Object,
      required: true
    },
    activeDropdownSongId: {
      type: [String, Number, null],
      default: null
    }
  },
  components: {
    LoadingSpinner,
    ScrollIndicator
  },
  setup(props, { emit }) {
    const isExpanded = ref(false);
    const lyrics = ref(null);
    const isLoading = ref(false);
    const isPlaylistLoading = ref(false);
    const isDarkMode = inject("isDarkMode");
    const playlists = inject("playlists");
    const { fetchPlaylists, createPlaylist, addToPlaylist, removeFromPlaylist } = usePlaylist();
    const user = inject("user");
    const showNewPlaylistInput = ref(false);
    const newPlaylistName = ref("");
    const playlistMenuRef = ref(null);
    const playlistContainerRef = ref(null);
    const preventClose = ref(false);
    const { showScrollIndicator, checkScroll } = useScrollIndicator(playlistMenuRef);


    onMounted(() => {
      document.addEventListener("click", closeMenuOnOutsideClick);
    });

    onUnmounted(() => {
      document.removeEventListener("click", closeMenuOnOutsideClick);
      if (playlistMenuRef.value) {
        playlistMenuRef.value.removeEventListener("scroll", checkScroll);
      }
    });

    async function fetchUser() {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        user.value = session.user;
        await fetchPlaylists();
      }
    }
    fetchUser();

    // Create a computed property that returns true if this song's dropdown should be open.
     const isDropdownOpen = computed(() => props.activeDropdownSongId === props.song.id);

    function closeMenuOnOutsideClick(event) {
      setTimeout(() => {
        if (preventClose.value) return;          if (playlistContainerRef.value && !playlistContainerRef.value.contains(event.target)) {
          // Emit null to close the dropdown in the parent
          emit("update-active-dropdown", null);
          showNewPlaylistInput.value = false;
        }
      }, 100);
    }

    const movementClasses = computed(() => {
      if (props.song.movement === 'NEW')
        return 'text-green-500 font-bold uppercase text-xs';
      if (props.song.movement.includes('↑'))
        return 'text-green-500';
      if (props.song.movement.includes('↓'))
        return 'text-red-500';
      return 'text-gray-500';
    });

    // ADD: Computed property for action buttons
    const actionButtons = computed(() => [
      props.song.youtube_url && {
        url: `https://www.youtube.com/watch?v=${props.song.youtube_url}`,
        icon: "fab fa-youtube fa-lg",
        color: "text-red-500 hover:text-red-600",
        class: "text-[20px] leading-[20px] min-height-[20px]"
      },
      props.song.apple_music_url && {
        url: props.song.apple_music_url,
        icon: "pi pi-apple fa-lg",
        color: "text-gray-300 hover:text-gray-400"
      },
      props.song.spotify_url && {
        url: `https://open.spotify.com/track/${props.song.spotify_url}`,
        icon: "fab fa-spotify fa-lg",
        color: "text-green-400 hover:text-green-500"
      }
    ].filter(Boolean));

    async function handleCreatePlaylist() {
      if (!newPlaylistName.value || !newPlaylistName.value.trim()) {
        console.error("🚨 Playlist name is empty!");
        return;
      }
      isPlaylistLoading.value = true;
      try {
        const newPlaylist = await createPlaylist(newPlaylistName.value);
        if (newPlaylist) {
          newPlaylistName.value = "";
          showNewPlaylistInput.value = false;
          newPlaylist.songs = Array.isArray(newPlaylist.songs) ? newPlaylist.songs : [];
          const success = await addToPlaylist(newPlaylist.id, props.song.id, user.value.id);
          if (success) {
            newPlaylist.songs.push(props.song.id);
          }
          playlists.value.unshift(newPlaylist);
        }
      } finally {
        isPlaylistLoading.value = false;
        preventClose.value = true;
        setTimeout(() => { preventClose.value = false; }, 100);
      }
    }

    async function handleAddSong(playlistId) {
      isPlaylistLoading.value = true;
      try {
        const success = await addToPlaylist(playlistId, props.song.id);
        if (success) {
          const playlist = playlists.value.find(p => p.id === playlistId);
          if (playlist) {
            playlist.songs.push(props.song.id);
          }
        }
      } finally {
        isPlaylistLoading.value = false;
        preventClose.value = true;
        setTimeout(() => { preventClose.value = false; }, 100);
      }
    }

    async function handleRemoveSong(playlistId) {
      isPlaylistLoading.value = true;
      try {
        const success = await removeFromPlaylist(playlistId, props.song.id);
        if (success) {
          const playlist = playlists.value.find(p => p.id === playlistId);
          if (playlist) {
            playlist.songs = playlist.songs.filter(songId => songId !== props.song.id);
          }
        }
      } finally {
        isPlaylistLoading.value = false;
        preventClose.value = true;
        setTimeout(() => { preventClose.value = false; }, 100);
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

    // Modify toggleNewPlaylistInput to open the dropdown if it isn't open.
    function toggleNewPlaylistInput() {
      if (!isDropdownOpen.value) {
        emit("update-active-dropdown", props.song.id);
      }
      showNewPlaylistInput.value = !showNewPlaylistInput.value;
    }

    // Update togglePlaylistMenu to use the parent state instead of local state.
    function togglePlaylistMenu(event) {
      event.stopPropagation();
      // Emit the current song id to toggle the dropdown in the parent.
      emit("update-active-dropdown", props.song.id);
    }

    const toggleExpand = async () => {
      isExpanded.value = !isExpanded.value;
      if (isExpanded.value && !lyrics.value) {
        isLoading.value = true;
        try {
          // Pass the song details along with any pre-existing lyrics.
          lyrics.value = await getLyrics(
            props.song.title,
            props.song.artist,
            props.song.melon_song_id,
            props.song.lyrics
          );
        } catch (error) {
          console.error("❌ Failed to fetch lyrics:", error);
        } finally {
          isLoading.value = false;
        }
      }
    };

    return {
      isExpanded,
      lyrics,
      isLoading,
      isPlaylistLoading,
      toggleExpand,
      actionButtons,
      user,
      playlists,
      isDropdownOpen,
      showNewPlaylistInput,
      newPlaylistName,
      fetchUser,
      fetchPlaylists,
      createPlaylist,
      toggleSongInPlaylist,
      togglePlaylistMenu,
      playlistMenuRef,
      playlistContainerRef,
      closeMenuOnOutsideClick,
      isDarkMode,
      toggleNewPlaylistInput,
      handleCreatePlaylist,
      handleRemoveSong,
      handleAddSong,
      showScrollIndicator,
      preventClose,
      movementClasses
    };
  }
};
</script>
