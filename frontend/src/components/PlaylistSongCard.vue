<!-- components/PlaylistSongCard.vue -->
<template>
    <div class="song-card w-full flex flex-col p-4 shadow-lg border-t"
         :data-song-id="song.id">
      <div class="flex items-center gap-4 w-full">
        <!-- ✅ Album Art -->
        <img :src="song.art" :alt="song.album"
             class="w-16 h-16 rounded-md object-cover border border-surface-400" />
  
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
        <div class="flex flex-col sm:flex-row items-center gap-2">
          <template v-for="(button, index) in actionButtons" :key="index">
          <a v-if="button.url" :href="button.url" target="_blank" class="text-xl" :class="button.color">
            <i :class="button.icon"></i>
          </a>
        </template>
          
          <select v-model="targetPlaylist" class="text-xs text-gray-700 border rounded px-1 py-0.5">
            <option disabled value="">Add to playlist...</option>
            <template v-for="p in allPlaylists" :key="p.id">
              <option v-if="p.id !== currentPlaylistId" :value="p.id">
                {{ p.name }}
              </option>
            </template>
          </select>

  
          <button
            v-if="targetPlaylist"
            class="text-xs text-blue-500 hover:text-blue-700"
            @click="$emit('moveSongTo', { songId: song.id, toPlaylistId: targetPlaylist })">
            Move
          </button>

          <button
                @click.stop="openModal"
                class="text-red-600 hover:text-red-800 px-2 text-md cursor-pointer"
                title="Delete Song from Playlist"
            >
            <i class="fa-solid fa-trash-can"></i>
         </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref,  markRaw, computed  } from "vue";
  import DeletionConfirmationModal from "@/components/modals/DeletionConfirmationModal.vue";
  import Modal from "@/components/Modal.vue";
  

  const activeModalComponent = ref(null);
  const activeModalProps = ref({});
  const targetPlaylist = ref("");
  const songName = computed(() => song.title || "this song");
  const playlistName = computed(() => {
  const current = allPlaylists.find(p => p.id === currentPlaylistId);
    return current?.name || "this playlist";
  });

  function openModal() {

    activeModalComponent.value = markRaw(DeletionConfirmationModal);
    activeModalProps.value = {
      title: "Delete Playlist",
      message: `Are you sure you want to remove "${songName.value}" from "${playlistName.value}"?`,
      confirmText: "Remove Song",
      confirmColor: "red",
      action: async () => {
        emit("removeSong", song.id);
      },
    };
  }

      // ADD: Computed property for action buttons
      const actionButtons = computed(() => [
      song.youtube_url && {
        url: `https://www.youtube.com/watch?v=${song.youtube_url}`,
        icon: "fab fa-youtube fa-lg",
        color: "text-red-500 hover:text-red-600",
        class: "text-[20px] leading-[20px] min-height-[20px]"
      },
      song.apple_music_url && {
        url: song.apple_music_url,
        icon: "pi pi-apple fa-lg",
        color: "text-gray-300 hover:text-gray-400"
      },
      song.spotify_url && {
        url: `https://open.spotify.com/track/${song.spotify_url}`,
        icon: "fab fa-spotify fa-lg",
        color: "text-green-400 hover:text-green-500"
      }
    ].filter(Boolean));
    const { song, allPlaylists, currentPlaylistId } = defineProps({
      song: Object,
      allPlaylists: Array,
      currentPlaylistId: [String, Number],
    });
  defineEmits(["removeSong", "moveSongTo"]);
  </script>
  