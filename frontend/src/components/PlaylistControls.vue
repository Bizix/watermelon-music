<template>
  <div class="w-full bg-surface-100 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
    <input
      v-model="internalValue"
      type="text"
      placeholder="Search playlists..."
      class="px-3 py-1 rounded border w-full sm:w-auto text-sm"
    />

     <!-- Show input for new playlist creation -->
     <template v-if="showNewPlaylistInput">
        <input
          v-model="newPlaylistName"
          type="text"
          placeholder="New playlist name..."
          class="px-3 py-1 rounded border text-sm"
        />
        <button
          @click="submitNewPlaylist"
          :disabled="!newPlaylistName.trim()"
          class="px-3 py-1 text-sm text-white rounded transition"
          :class="{
            'bg-green-500 hover:bg-green-600': newPlaylistName.trim(),
            'bg-gray-300 cursor-not-allowed': !newPlaylistName.trim()
          }"
        >
          Create
        </button>
        <button
          @click="cancelCreate"
          class="text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </template>
    <div class="flex gap-2 justify-end">
      <button
        v-if="!showNewPlaylistInput"
        @click="showNewPlaylistInput = true"
        class="bg-[var(--p-primary-color)] text-white px-3 py-1 rounded text-sm hover:bg-[var(--p-primary-400)]"
      >
        Create Playlist
      </button>

      <button
        v-if="!isSpotifyConnected"
        @click="$emit('connectSpotify')"
        class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
      >
        Connect Spotify
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
  // Define a prop for v-model
  const props = defineProps({
    modelValue: { type: String, default: "" },
    isSpotifyConnected: Boolean,
  });
  
  // Define emit with the update event for v-model
  const emit = defineEmits(["update:modelValue", "connectSpotify", "create"]);

  // Using a computed getter/setter to bridge v-model automatically.
  const internalValue = computed({
    get() {
      return props.modelValue;
    },
    set(val) {
      emit("update:modelValue", val);
    }
  });

  const showNewPlaylistInput = ref(false);
  const newPlaylistName = ref("");

  function submitNewPlaylist() {
    if (newPlaylistName.value.trim()) {
      emit("create", newPlaylistName.value.trim());
      newPlaylistName.value = "";
      showNewPlaylistInput.value = false;
    }
  }

  function cancelCreate() {
    showNewPlaylistInput.value = false;
    newPlaylistName.value = "";
  }
</script>
