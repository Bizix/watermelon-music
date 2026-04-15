import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("primevue") || id.includes("@primeuix") || id.includes("primeicons")) {
            return "ui";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("fontawesome")) {
            return "icons";
          }
        },
      },
    },
  },
});
