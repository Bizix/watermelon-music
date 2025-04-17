<!-- components/PlaylistSongCard.vue -->
<template>
  <div 
     v-bind="attrs" 
     v-if="!props.removing"
     class="song-card w-full flex flex-col p-4 shadow-lg border-t"
     :data-song-id="props.song.id">
       <div class="flex items-center w-full">
        <!-- drag handle -->
        <i 
          class="pi pi-bars drag-handle cursor-move text-2xl text-gray-400 hover:text-gray-600 mr-4"
          title="Drag to reorder" 
        />
        <!-- ✅ Album Art -->
        <img :src="props.song.art" :alt="props.song.album"
           class="w-16 h-16 rounded-md object-cover border border-surface-400 mr-3" />
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
        <div class="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
           <template v-for="(button, index) in actionButtons" :key="index">
              <a v-if="button.url" :href="button.url" target="_blank" class="text-xl" :class="button.color">
              <i :class="button.icon"></i>
              </a>
           </template>
           <!-- ✅ Add to Playlist Button -->
           <button
              @click="togglePlaylistDropdown"
              :disabled="!canAddToAnyPlaylist"
              :class="[
                'text-slg font-medium rounded-lg',
                canAddToAnyPlaylist 
                  ? 'cursor-pointer text-[var(--p-primary-color)] hover:text-[var(--p-primary-400)]' 
                  : 'cursor-not-allowed text-gray-400'
              ]"
            >
              +
            </button>
           <!-- ✅ Custom Playlist Dropdown -->
           <div
              v-if="isDropdownOpen"
              ref="dropdownRef"

              class="absolute right-0 mt-2 w-48 shadow-lg z-50 rounded-lg overflow-hidden"
              :class="{
              'bg-[var(--p-surface-50)] text-black': !isDarkMode,
              'bg-[var(--p-surface-100)] text-white': isDarkMode
              }"
              >
              <div
                 v-for="(playlist, index) in filteredPlaylists"
                 :key="playlist.id"
                 @click.stop="handleAddToPlaylist(playlist.id)"
                 class="cursor-pointer text-sm px-3 py-2 hover:bg-gray-200 border-t border-gray-400"
                 :class="{ 'rounded-b-lg': index === filteredPlaylists.length - 1 }"
                 >
                 {{ playlist.name }}
              </div>
           </div>
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
  import { ref,  markRaw, computed, inject, onMounted, onBeforeUnmount } from "vue";
  import DeletionConfirmationModal from "@/components/modals/DeletionConfirmationModal.vue";
  import Modal from "@/components/Modal.vue";
  import { useAttrs } from "vue";


  const attrs = useAttrs();
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
  const canAddToAnyPlaylist = computed(() => {
    return props.allPlaylists.some(
      (p) => p.id !== props.currentPlaylistId && !p.songs.includes(props.song.id)
    );
  });

const isDropdownOpen = ref(false);
const isDarkMode = inject("isDarkMode");
const dropdownRef = ref(null);


function togglePlaylistDropdown() {
  // Always remove listener before toggling
  document.removeEventListener("click", handleClickOutside);

  isDropdownOpen.value = !isDropdownOpen.value;

  if (isDropdownOpen.value) {
    // Delay to allow DOM update and prevent immediate closure
    requestAnimationFrame(() => {
      document.addEventListener("click", handleClickOutside);
    });
  }
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false;
    document.removeEventListener("click", handleClickOutside);
  }
}

const filteredPlaylists = computed(() =>
  props.allPlaylists.filter(
    (p) => p.id !== props.currentPlaylistId && !p.songs.includes(props.song.id)
  )
);

function handleAddToPlaylist(playlistId) {
  isDropdownOpen.value = false;
  emit("moveSongTo", { songId: props.song.id, toPlaylistId: playlistId });
}


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
  