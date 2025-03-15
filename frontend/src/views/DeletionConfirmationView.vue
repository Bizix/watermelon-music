<template>
    <div class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
      :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
      }">
      
      <!-- Close Button -->
      <button @click="$emit('close')" aria-label="Close" class="absolute top-3 right-3 text-xl">✖</button>
      
      <!-- Modal Title -->
      <h2 class="text-2xl font-bold text-center mb-6"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }">
        Delete Account
      </h2>
      
      <!-- Modal Message -->
      <p class="text-center mb-6">
        Are you sure you want to delete your account? All associated playlist data will also be deleted.
      </p>
      
      <div class="flex justify-center gap-4">
        <!-- Cancel Button -->
        <button @click="$emit('close')"
          class="px-4 py-2 rounded-lg border transition-all duration-300"
          :class="{
            'bg-gray-200 text-black hover:bg-gray-300': !isDarkMode,
            'bg-gray-700 text-white hover:bg-gray-600': isDarkMode
          }">
          Cancel
        </button>
        
        <!-- Confirm Button -->
        <button @click="deleteAccount"
          class="px-4 py-2 font-medium rounded-lg transition-all duration-300"
          :class="{
            'bg-red-500 text-white hover:bg-red-600': !isDarkMode,
            'bg-red-700 text-white hover:bg-red-800': isDarkMode
          }"
          :disabled="isDeleting">
          <span v-if="isDeleting">Deleting...</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { inject, ref } from "vue";
  import { supabase } from "@/lib/supabaseClient"; 
  import { useRouter } from "vue-router";  

  const isDarkMode = inject("isDarkMode");
  const isDeleting = ref(false);
  const router = useRouter();
  
  async function deleteAccount() {
    if (isDeleting.value) return;
    isDeleting.value = true;
  
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError || !user?.id) {
    console.error("User not found or error:", userError);
    isDeleting.value = false;
    return;
  }

  try {
    // Make a secure API call to delete user (backend needed)
    const response = await fetch("/api/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || "Failed to delete user");
    }

    // Sign out after deletion
    await supabase.auth.signOut();

    // Redirect user to the Goodbye page
    router.push("/goodbye");

  } catch (error) {
    console.error("Error deleting account:", error.message);
  } finally {
    isDeleting.value = false;
  }
  }
  </script>
  