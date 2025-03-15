<template>
    <div
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
      @click.capture.self="$emit('close')"
    >
        <component :is="modalComponent" v-bind="modalProps" @close="$emit('close')" />
    </div>
  </template>
  
  <script setup>
  import { inject, computed } from "vue";
  
  const props = defineProps({
    modalComponent: { type: [Object, Function], required: true },
    modalProps: { type: Object, default: () => ({}) },
  });
  
  const emit = defineEmits(["close"]);
  
  const isDarkMode = inject("isDarkMode");
  
  const modalClasses = computed(() => ({
    "bg-white text-black border border-gray-300": !isDarkMode.value,
    "bg-black text-white border border-[var(--p-primary-400)]": isDarkMode.value,
  }));
  </script>
  