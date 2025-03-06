<template>
    <div 
      v-if="showScrollIndicator" 
      class="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-900 to-transparent flex justify-center items-end pointer-events-none"
    >
      <p class="text-gray-400 text-sm animate-bounce">↓ Scroll for more ↓</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      showScrollIndicator: Boolean, // ✅ Accept boolean prop
    }
  };
  </script>
  