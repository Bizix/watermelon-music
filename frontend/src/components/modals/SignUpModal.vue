<template>
    <div
      class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
      :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border border-[var(--p-primary-400)]': isDarkMode
      }"
    >
      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute right-3 top-3 text-lg"
      >
        ✕
      </button>
  
      <!-- Title -->
      <h2
        class="text-2xl font-bold text-center mb-6"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }"
      >
        Create an Account
      </h2>
  
      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full px-4 py-2 mb-4 rounded transition-all"
        :class="inputClasses"
      />
  
      <!-- Password -->
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full px-4 py-2 mb-4 rounded transition-all"
        :class="inputClasses"
      />
  
      <!-- Confirm Password -->
      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        class="w-full px-4 py-2 mb-4 rounded transition-all"
        :class="inputClasses"
      />
  
      <!-- Error message -->
      <p v-if="errorMessage" class="text-sm text-red-400 text-center mb-3">
        ❗ {{ errorMessage }}
      </p>
  
      <!-- Sign-up button -->
      <button
        @click="signUp"
        class="w-full py-2 rounded-lg font-semibold transition"
        :class="buttonClasses"
      >
        Sign Up
      </button>

      <!-- Divider -->
      <div class="my-4 text-center text-sm text-gray-400">OR</div>

      <!-- Google Sign-Up -->
      <button
        @click="signUpWithGoogle"
        class="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
        :class="{
          'bg-red-500 text-white hover:bg-red-600': !isDarkMode,
          'bg-red-700 text-white hover:bg-red-800': isDarkMode
        }"
      >
        <i class="pi pi-google"></i> Sign Up with Google
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, inject, computed } from "vue";
  import { supabase } from "@/lib/supabaseClient";
  
  const email = ref("");
  const password = ref("");
  const confirmPassword = ref("");
  const errorMessage = ref("");
  
  const emit = defineEmits(["close"]);
  const isDarkMode = inject("isDarkMode", ref(false)); // Ensure default value if injection fails
  
  const inputClasses = computed(() =>
    isDarkMode.value
      ? "bg-black border border-[var(--p-primary-400)] text-white focus:ring-2 focus:ring-[var(--p-primary-400)]"
      : "bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[var(--p-primary-color)]"
  );
  
  const buttonClasses = computed(() =>
    isDarkMode.value
      ? "bg-[var(--p-primary-400)] text-black hover:bg-[var(--p-primary-500)]"
      : "bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-500)]"
  );
  
  async function signUp() {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });

  if (error) {
    errorMessage.value = error.message;
  } else {
    errorMessage.value =
      "A confirmation email has been sent. Please check your inbox and verify your email before logging in.";
  }
}


  // ✅ Google OAuth sign-up
  async function signUpWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      errorMessage.value = error.message;
    }
  }
  </script>
