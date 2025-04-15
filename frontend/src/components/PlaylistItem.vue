<template>
    <div
      class="w-full flex flex-col p-4 shadow-lg border-y border-surface-300 transition hover:bg-[var(--p-surface-50)]"
      :data-playlist-id="playlist.id"
    >
      <div class="flex items-center justify-between">
        <!-- ✅ Playlist Info -->
        <div class="pl-2 sm:pl-4 flex flex-col">
          <template v-if="isEditing">
            <input
              v-model="editedName"
              @keyup.enter="saveEdit"
              @blur="saveEdit"
              class="text-sm sm:text-lg font-semibold text-surface-900 bg-transparent border-b border-surface-400 focus:outline-none"
            />
          </template>
          <template v-else>
            <p
              @click="startEditing"
              class="text-sm sm:text-lg font-semibold text-surface-900 hover:underline"
            >
              {{ playlist.name }}
            </p>
          </template>
          <p class="text-sm text-surface-600 italic">
            {{ playlist.songs.length }} {{ playlist.songs.length === 1 ? "song" : "songs" }}
          </p>
        </div>
  
        <!-- ✅ Action Buttons -->
        <div class="flex items-center gap-2 text-right">
          <button
            @click="$emit('select', playlist.id)"
            class="text-white px-3 py-1 text-sm cursor-pointer bg-[var(--p-primary-color)] rounded-lg hover:bg-[var(--p-primary-400)]"
          >
            View
          </button>
          <button
                @click.stop="openModal"
                class="text-red-600 hover:text-red-800 px-2 text-md cursor-pointer"
                title="Delete Playlist"
            >
            <i class="fa-solid fa-trash-can"></i>
         </button>
        </div>
      </div>
  
      <!-- ✅ Modal -->
      <Modal
        v-if="activeModalComponent"
        :modalComponent="activeModalComponent"
        :modalProps="activeModalProps"
        @close="closeModal"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, inject } from "vue";
  import { markRaw } from "vue";
  import DeletionConfirmationModal from "@/components/modals/DeletionConfirmationModal.vue";
  import Modal from "@/components/Modal.vue";
  
  const emit = defineEmits(["select", "rename", "delete"]);  

  const props = defineProps(["playlist"]);
  const activeModalComponent = ref(null);
  const activeModalProps = ref({});
  const isEditing = ref(false);
  const editedName = ref("");
  const isDarkMode = inject("isDarkMode");
  
  function startEditing() {
    isEditing.value = true;
    editedName.value = props.playlist.name;
  }
  
  function saveEdit() {
    isEditing.value = false;
    if (editedName.value.trim() && editedName.value !== props.playlist.name) {
      emit("rename", { id: props.playlist.id, newName: editedName.value.trim() });
    }
  }
  
  function openModal() {
  const playlistId = props.playlist.id;
  const playlistName = props.playlist.name;

  activeModalComponent.value = markRaw(DeletionConfirmationModal);
  activeModalProps.value = {
    title: "Delete Playlist",
    message: `Are you sure you want to delete "${playlistName}"?`,
    confirmText: "Delete Playlist",
    confirmColor: "red",
    action: async () => {
      emit("delete", playlistId);
    },
  };
}
  
  function closeModal() {
    activeModalComponent.value = null;
  }
  </script>
  
  