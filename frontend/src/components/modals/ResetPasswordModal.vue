<template>
    <div class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
      :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
      }">
      
      <!-- ✅ Close Button -->
      <button @click="$emit('close')" class="absolute top-3 right-3 text-xl">
        ✖
      </button>
  
      <!-- ✅ Title -->
      <h2 class="text-2xl font-bold text-center mb-6"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }">
        Reset Password
      </h2>
  
      <!-- ✅ Email Input -->
      <input
        v-model="email"
        type="email"
        placeholder="Enter your email"
        class="w-full p-3 mb-3 rounded-lg border transition-all duration-300"
        :class="{
          'border-gray-300 bg-gray-100 text-black focus:ring-2 focus:ring-[var(--p-primary-color)]': !isDarkMode,
          'border-[var(--p-primary-400)] bg-black text-white focus:ring-2 focus:ring-[var(--p-primary-400)]': isDarkMode
        }"
      />
  
      <!-- ✅ Error & Success Messages -->
      <p v-if="errorMessage" class="text-center text-red-500 mt-3">❌ {{ errorMessage }}</p>
      <p v-if="successMessage" class="text-center text-green-500 mt-3">✔️ {{ successMessage }}</p>
  
      <!-- ✅ Buttons -->
<div class="flex justify-center gap-2 mt-4">
  <button @click="$emit('close')" class="px-4 py-2 font-medium rounded-lg transition-all duration-300"
    :class="{
      'bg-gray-300 text-black hover:bg-gray-400': !isDarkMode,
      'bg-gray-600 text-white hover:bg-gray-700': isDarkMode
    }">
    Back
  </button>
  <button @click="resetPassword" class="px-4 py-2 font-medium rounded-lg transition-all duration-300"
    :class="{
      'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
      'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
    }">
    Confirm
  </button>
</div>
    </div>
  </template>
  
  <script setup>
  import { ref, inject } from "vue";
  import { supabase } from "@/lib/supabaseClient";
  
  const email = ref("");
  const errorMessage = ref("");
  const successMessage = ref("");
  const isDarkMode = inject("isDarkMode");
  
  // ✅ Reset Password Function
  async function resetPassword() {
    errorMessage.value = "";
    successMessage.value = "";
  
    if (!email.value) {
      errorMessage.value = "Please enter your email.";
      return;
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email.value);
  
    if (error) {
      errorMessage.value = error.message;
    } else {
      successMessage.value = "📩 Password reset email sent! Check your inbox.";
    }
  }
  </script>
  