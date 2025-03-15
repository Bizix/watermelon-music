<template>
    <!-- TODO - Make each of these buttons work -->
    <div class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
      :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
      }">
      
      <!-- Close Button -->
      <button @click="$emit('close')" class="absolute right-3 top-3 text-lg">
        ✕
      </button>
      
      <!-- Header -->
      <h2 class="text-2xl font-bold text-center mb-6"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }">
        Account Settings
      </h2>
      
      <!-- Link Spotify Auth -->
      <button class="w-full px-4 py-2 font-medium rounded-lg transition-all duration-300"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
        }">
        Link Spotify Account
      </button>
      
      <!-- Change Password -->
      <button class="w-full px-4 py-2 font-medium rounded-lg mt-4 transition-all duration-300"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
        }">
        Change Password
      </button>
      
      <!-- Delete Account -->
      <button class="w-full px-4 py-2 font-medium rounded-lg mt-4 text-red-500 border border-red-400 transition-all duration-300"
        :class="{
          'hover:bg-red-100': !isDarkMode,
          'hover:bg-red-900': isDarkMode
        }">
        Delete Account
      </button>
    </div>
  </template>
  
  <script setup>
  import { inject } from "vue";
  const isDarkMode = inject("isDarkMode");
  </script>
  