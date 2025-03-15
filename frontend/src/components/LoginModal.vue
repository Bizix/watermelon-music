<template>
    <!-- ✅ Modal Overlay -->
    <div
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50"
      @click.capture.self="closeModal"
    >
      <div
        class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300"
      >
        <!-- ✅ Embed LoginView -->
        <LoginView @close="closeModal" />
      </div>
    </div>
</template>
  
<script setup>
    import { inject } from "vue";
    import LoginView from "@/views/LoginView.vue";
    
    const isDarkMode = inject("isDarkMode");
    
    const emit = defineEmits(["close"]);
    const closeModal = () => emit("close");
</script>
  