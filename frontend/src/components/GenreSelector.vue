<template>
  <div class="p-2 w-full">
    <div class="flex flex-wrap justify-center gap-2 px-2 overflow-hidden">
      <button
        v-for="(label, code) in genreOptions"
        :key="code"
        @click="emitGenre(code)"
        :disabled="isLoading"
        class="px-2 py-1 text-xs font-medium rounded transition duration-200"
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
