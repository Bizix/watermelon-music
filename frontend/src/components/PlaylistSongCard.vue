<!-- components/PlaylistSongCard.vue -->
<template>
    <div  
      v-if="!props.removing"
      class="song-card w-full flex flex-col p-4 shadow-lg border-t"
      :data-song-id="props.song.id">
      <div class="flex items-center gap-4 w-full">
        <!-- ✅ Album Art -->
        <img :src="props.song.art" :alt="props.song.album"
             class="w-16 h-16 rounded-md object-cover border border-surface-400" />
  
        <!-- ✅ Song Info -->
        <div class="flex flex-col flex-grow">
          <p class="text-sm sm:text-lg font-semibold text-surface-900">
            {{ props.song.title }}
          </p>
          <p class="text-sm sm:text-lg text-surface-800">
            {{ props.song.artist }}
          </p>
          <p class="text-sm italic text-surface-600">
            {{ props.song.album }}
          </p>
        </div>
  
        <!-- ✅ Action Buttons -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
          <template v-for="(button, index) in actionButtons" :key="index">
          <a v-if="button.url" :href="button.url" target="_blank" class="text-xl" :class="button.color">
            <i :class="button.icon"></i>
          </a>
        </template>
          
        <select
          multiple
          v-model="selectedPlaylists"
          class="text-xs text-gray-700 border rounded px-1 py-0.5"
        >
          <template v-for="p in availablePlaylists" :key="p.id">
            <option :value="p.id">{{ p.name }}</option>
          </template>
        </select>

          <button
                @click.stop="openModal"
                :disabled="props.removing"
                class="text-red-600 hover:text-red-800 px-2 text-md cursor-pointer"
                title="Delete Song from Playlist"
            >
            <i class="fa-solid fa-trash-can"></i>
         </button>
        </div>
      </div>
    </div>
          <!-- ✅ Modal -->
          <Modal
        v-if="activeModalComponent"
        :modalComponent="activeModalComponent"
        :modalProps="activeModalProps"
        @close="closeModal"
      />
  </template>
  
  <script setup>
  import { ref,  markRaw, computed, inject } from "vue";
  import DeletionConfirmationModal from "@/components/modals/DeletionConfirmationModal.vue";
  import Modal from "@/components/Modal.vue";
  
  const emit = defineEmits(["removeSong", "moveSongTo"]);
  const props = defineProps(["song", "allPlaylists", "currentPlaylistId", "playlistName", "removing"]);

  
  const activeModalComponent = ref(null);
  const activeModalProps = ref({});
  const targetPlaylist = ref("");
  const songName = computed(() => props.song.title || "this song");
  const selectedPlaylists = ref([]);
  const availablePlaylists = computed(() => {
  return props.allPlaylists.filter(p =>
    p.id !== props.currentPlaylistId && !p.songs.includes(props.song.id)
  );
});


  function openModal() {
    activeModalComponent.value = markRaw(DeletionConfirmationModal);

    activeModalProps.value = {
      title: "Delete Song",
      message: `Are you sure you want to remove "${songName.value}" from "${props.playlistName}"?`,
      confirmText: "Remove Song",
      confirmColor: "red",
      action: async () => {
        emit("removeSong", props.song.id);
      },
    };

    }
    function closeModal() {
      activeModalComponent.value = null;
    }

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
  </script>
  