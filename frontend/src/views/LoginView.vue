<template>
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 class="text-2xl font-bold mb-4">Supabase Auth Test</h2>
  
      <!-- Email Login Form -->
      <input v-model="email" type="email" placeholder="Email" class="border p-2 mb-2 w-64" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 mb-2 w-64" />
      <button @click="login" class="bg-green-500 text-white p-2 w-64">Login with Email</button>
      <button @click="signUp" class="bg-blue-500 text-white p-2 w-64 mt-2">Sign Up</button>
  
      <!-- Google OAuth -->
      <button @click="loginWithGoogle" class="bg-red-500 text-white p-2 w-64 mt-4">
        Login with Google
      </button>
  
      <!-- Logout -->
      <button @click="logout" class="bg-gray-500 text-white p-2 w-64 mt-4">
        Logout
      </button>
  
      <p v-if="user" class="mt-4 text-green-600">✅ Logged in as: {{ user.email }}</p>
      <p v-if="errorMessage" class="mt-4 text-red-600">❌ {{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { supabase } from "@/lib/supabaseClient"; // ✅ Import Supabase Client
  
  const email = ref("");
  const password = ref("");
  const user = ref(null);
  const errorMessage = ref("");
  
  // ✅ Check session when page loads
  onMounted(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      user.value = session.user;
    }
  });
  
  // ✅ Email login
  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) {
      errorMessage.value = error.message;
    } else {
      user.value = data.user;
      errorMessage.value = "";
    }
  }
  
  // ✅ Email sign up (for testing)
  async function signUp() {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (error) {
      errorMessage.value = error.message;
    } else {
      user.value = data.user;
      errorMessage.value = "✅ Sign-up successful! Please check your email to confirm.";
    }
  }
  
  // ✅ Google OAuth login
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      errorMessage.value = error.message;
    }
  }
  
  // ✅ Logout
  async function logout() {
    await supabase.auth.signOut();
    user.value = null;
    errorMessage.value = "";
  }
  </script>
  