<template>
  <div class="w-full bg-surface-100 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
    <input
      v-model="internalValue"
      type="text"
      placeholder="Search playlists..."
      class="px-3 py-1 rounded border w-full sm:w-auto text-sm"
    />

    <div class="flex gap-2 justify-end">
      <button
        @click="$emit('create')"
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
import { computed } from 'vue';
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
</script>
