<template>
  <div class="p-2">
    <!-- Dropdown for mobile screens -->
    <select
      class="block sm:hidden w-full mx-auto p-2 border rounded"
      :value="selectedGenre"
      @change="emitGenre($event.target.value)"
      :disabled="isLoading"
      :style="{
          backgroundColor:'var(--p-surface-100)',
          color: 'var(--p-text-primary)',
          opacity: isLoading ? 0.5 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }"
    >
      <option 
        v-for="(label, code) in genreOptions" 
        :key="code" 
        :value="code"
      >
        {{ label }}
      </option>
    </select>

    <!-- Button group for larger screens -->
    <div class="hidden sm:flex flex-wrap justify-center gap-2 px-2 overflow-hidden">
      <button
        v-for="(label, code) in genreOptions"
        :key="code"
        @click="emitGenre(code)"
        :disabled="isLoading"
        class="px-2 py-1 text-xs font-medium rounded"
        :style="{
          backgroundColor: selectedGenre === code ? 'var(--p-primary-color)' : 'var(--p-surface-100)',
          color: selectedGenre === code ? 'white' : 'var(--p-text-primary)',
          opacity: isLoading ? 0.5 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    selectedGenre: {
      type: String,
      required: true,
    },
    genreMap: {
      type: Object,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    genreOptions() {
      return this.genreMap;
    },
  },
  methods: {
    emitGenre(genreCode) {
      if (!this.isLoading) {
        this.$emit("genre-selected", genreCode);
      }
    },
  },
};
</script>
