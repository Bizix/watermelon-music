<template>
  <div class="bg-gray-800 p-2 shadow-md w-full">
    <div class="flex flex-wrap justify-center gap-2 px-2 overflow-hidden">
      <button
        v-for="(label, code) in genreOptions"
        :key="code"
        @click="emitGenre(code)"
        :class="buttonClass(code)"
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
  },
  computed: {
    genreOptions() {
      return this.genreMap;
    },
  },
  methods: {
    emitGenre(genreCode) {
      this.$emit("genre-selected", genreCode);
    },
    buttonClass(code) {
      return [
        "px-2 py-1 text-xs font-medium rounded transition duration-200",
        this.selectedGenre === code
          ? "bg-green-500 text-white shadow-md"
          : "bg-gray-700 text-gray-300 hover:bg-green-400 hover:text-white",
      ];
    },
  },
};
</script>
