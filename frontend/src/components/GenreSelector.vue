<template>
  <div class="flex justify-center space-x-3 bg-gray-800 p-3 rounded-lg shadow-md">
    <button
      v-for="(label, code) in genreMap"
      :key="code"
      @click="selectGenre(code)"
      :class="[
        'px-4 py-2 rounded-lg transition duration-300',
        selectedGenre === code ? 'bg-green-500 text-white font-semibold shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-green-400 hover:text-white'
      ]"
    >
      {{ label }}
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedGenre: "DM0000", // Default genre
      genreMap: {
        "DM0000": "Top 100",
        "GN0100": "Ballads",
        "GN0200": "K-Pop",
        "GN0300": "K-Rap",
        "GN0400": "R&B",
        "GN0500": "Indie",
        "GN0600": "Rock",
        "GN0700": "Trot",
        "GN0800": "Folk",
        "GN1500": "OST",
        "GN1700": "Jazz",
        "GN1800": "New Age",
        "GN1900": "J-Pop",
        "GN2200": "Children",
        "GN2400": "Korean Traditional",
      },
    };
  },
  methods: {
    selectGenre(genreCode) {
      this.selectedGenre = genreCode;
      this.$emit("genre-selected", genreCode);
    },
  },
};
</script>

