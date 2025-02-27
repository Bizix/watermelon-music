<template>
    <div class="flex justify-center my-4">
      <select v-model="selectedGenre" @change="emitGenre" class="p-2 border rounded-lg">
        <option v-for="(genre, code) in genres" :key="code" :value="code">
          {{ genre }}
        </option>
      </select>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  const genres = {
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
    "GN2400" : "Korean Traditional",
  };
  
  const selectedGenre = ref("DM0000");
  
  const emit = defineEmits(["genreSelected"]);
  
  const emitGenre = () => {
    emit("genreSelected", selectedGenre.value);
  };
  </script>
  