<template>
    <div class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
      :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
      }">
      
      <!-- Close Button -->
      <button @click="$emit('close')" aria-label="Close" class="absolute top-3 right-3 text-xl">✖</button>
      
      <!-- Modal Title -->
      <h2 class="text-2xl font-bold text-center mb-4"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }">
        Change Password
      </h2>
      
      <!-- Instruction -->
      <p class="text-center mb-4 text-sm">
        To change your password, enter the new password in both fields.
      </p>
  
      <!-- Password Fields -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">New Password</label>
        <input 
          type="password" 
          v-model="newPassword" 
          class="w-full px-3 py-2 rounded-lg border transition-all duration-300"
          :class="{
            'border-gray-300 focus:border-[var(--p-primary-color)]': !isDarkMode,
            'border-gray-600 bg-gray-800 text-white focus:border-[var(--p-primary-400)]': isDarkMode
          }"
        />
      </div>
  
      <div class="mb-6">
        <label class="block text-sm font-medium mb-1">Confirm Password</label>
        <input 
          type="password" 
          v-model="confirmPassword" 
          class="w-full px-3 py-2 rounded-lg border transition-all duration-300"
          :class="{
            'border-gray-300 focus:border-[var(--p-primary-color)]': !isDarkMode,
            'border-gray-600 bg-gray-800 text-white focus:border-[var(--p-primary-400)]': isDarkMode
          }"
        />
      </div>
  
      <!-- Buttons -->
      <div class="flex justify-center gap-4">
        <button @click="$emit('close')"
          class="px-4 py-2 rounded-lg border transition-all duration-300"
          :class="{
            'bg-gray-200 text-black hover:bg-gray-300': !isDarkMode,
            'bg-gray-700 text-white hover:bg-gray-600': isDarkMode
          }">
          Cancel
        </button>
  
        <button @click="changePassword"
          class="px-4 py-2 font-medium rounded-lg transition-all duration-300"
          :class="{
            'bg-green-500 text-white hover:bg-green-600': !isDarkMode,
            'bg-green-700 text-white hover:bg-green-800': isDarkMode
          }"
          :disabled="isProcessing">
          <span v-if="isProcessing">Updating...</span>
          <span v-else>Confirm</span>
        </button>
      </div>
  
      <!-- Error Message -->
      <p v-if="errorMessage" class="text-red-500 text-center text-sm mt-4">
        {{ errorMessage }}
      </p>
  
      <!-- Success Message -->
      <p v-if="successMessage" class="text-green-500 text-center text-sm mt-4">
        {{ successMessage }}
      </p>
  
    </div>
  </template>
  
  <script setup>
  import { ref, inject, defineEmits } from "vue";
  import { supabase } from "@/lib/supabaseClient"; 
  
  const isDarkMode = inject("isDarkMode");
  const emit = defineEmits(["close"]);
  
  const newPassword = ref("");
  const confirmPassword = ref("");
  const isProcessing = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  
  async function changePassword() {
    if (isProcessing.value) return;
    isProcessing.value = true;
    errorMessage.value = "";
    successMessage.value = "";
  
    if (!newPassword.value || !confirmPassword.value) {
      errorMessage.value = "Please fill in both fields.";
      isProcessing.value = false;
      return;
    }
  
    if (newPassword.value !== confirmPassword.value) {
      errorMessage.value = "Passwords do not match.";
      isProcessing.value = false;
      return;
    }
  
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.value });
  
      if (error) {
        throw error;
      }
  
      successMessage.value = "Password updated successfully!";
      setTimeout(() => emit("close"), 1500); // Close modal after success
    } catch (error) {
      errorMessage.value = error.message || "Failed to update password.";
    } finally {
      isProcessing.value = false;
    }
  }
  </script>
  