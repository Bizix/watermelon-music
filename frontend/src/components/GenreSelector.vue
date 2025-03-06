<template>
  <div class="bg-gray-800 p-2 shadow-md w-full">
    <div class="flex flex-wrap justify-center gap-2 px-2 overflow-hidden">
      <button
        v-for="(label, code) in genreMap"
        :key="code"
        @click="selectGenre(code)"
        :class="[ 
          'px-2 py-1 text-xs font-medium rounded transition duration-200',
          selectedGenre === code
            ? 'bg-green-500 text-white shadow-md'
            : 'bg-gray-700 text-gray-300 hover:bg-green-400 hover:text-white'
        ]"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    selectedGenre: String, // ✅ Accept selectedGenre as a prop
  },
  data() {
    return {
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
      this.$emit("genre-selected", genreCode); // ✅ Emit to parent
    },
  },
};
</script>
