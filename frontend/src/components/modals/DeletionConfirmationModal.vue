<!-- components/modals/DeletionConfirmationModal.vue -->
<template>
  <div class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
    :class="{
      'bg-white text-black border-gray-300': !isDarkMode,
      'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
    }">

    <button @click="$emit('close')" class="absolute top-3 right-3 text-xl" aria-label="close">✖</button>

    <h2 class="text-2xl font-bold text-center mb-6"
      :class="{
        'text-[var(--p-primary-color)]': !isDarkMode,
        'text-[var(--p-primary-400)]': isDarkMode
      }">
      {{ title }}
    </h2>

    <p class="text-center mb-6">{{ message }}</p>

    <div class="flex justify-center gap-4">
      <button @click="$emit('close')"
        class="px-4 py-2 rounded-lg border transition-all duration-300"
        :class="{
          'bg-gray-200 text-black hover:bg-gray-300': !isDarkMode,
          'bg-gray-700 text-white hover:bg-gray-600': isDarkMode
        }">
        Cancel
      </button>

      <button @click="handleConfirm"
        class="px-4 py-2 font-medium rounded-lg transition-all duration-300"
        :class="{
          'bg-red-500 text-white hover:bg-red-600': !isDarkMode,
          'bg-red-700 text-white hover:bg-red-800': isDarkMode
        }"
        :disabled="isProcessing">
        <span v-if="isProcessing">Processing...</span>
        <span v-else>{{ confirmText }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from "vue";

const props = defineProps({
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: "Delete"
  },
  action: Function, // ⚠️ Must return a Promise
});

const emit = defineEmits(["close", "completed"]);
const isDarkMode = inject("isDarkMode");
const isProcessing = ref(false);

async function handleConfirm() {
  if (isProcessing.value || !props.action) return;
  isProcessing.value = true;

  try {
    await props.action();
    emit("completed");
    emit("close");
  } catch (err) {
    console.error("❌ Action failed:", err);
  } finally {
    isProcessing.value = false;
  }
}
</script>