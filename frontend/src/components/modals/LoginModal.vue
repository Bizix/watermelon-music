<template>
    <div v-if="!isResetPasswordModalOpen" @close="$emit('close')" class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
  :class="{
        'bg-white text-black border-gray-300': !isDarkMode,
        'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
    }">
      <!-- ✅ Close Button -->
      <button @click="$emit('close')" class="absolute top-3 right-3 text-xl">
        ✖
      </button>
      
    <!-- ✅ Show Spinner While Loading -->
        <!-- ✅ Show Spinner While Loading -->
        <div v-if="isLoading" class="flex flex-grow pt-3 items-center justify-center">
          <LoadingSpinner :isLoading="true" message="Logging In..." size="w-10 h-10" color="fill-green-500" />
        </div>

        
        <div v-else> 
 <!-- ✅ Login Title -->
 <h2 class="text-2xl font-bold text-center mb-6"
        :class="{
          'text-[var(--p-primary-color)]': !isDarkMode,
          'text-[var(--p-primary-400)]': isDarkMode
        }">
        Log In to WaterMelon
      </h2>
      

      <!-- ✅ Email Input -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full p-3 mb-3 rounded-lg border transition-all duration-300"
        :class="{
          'border-gray-300 bg-gray-100 text-black focus:ring-2 focus:ring-[var(--p-primary-color)]': !isDarkMode,
          'border-[var(--p-primary-400)] bg-black text-white focus:ring-2 focus:ring-[var(--p-primary-400)]': isDarkMode
        }"
      />

      <!-- ✅ Password Input -->
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full p-3 mb-3 rounded-lg border transition-all duration-300"
        :class="{
          'border-gray-300 bg-gray-100 text-black focus:ring-2 focus:ring-[var(--p-primary-color)]': !isDarkMode,
          'border-[var(--p-primary-400)] bg-black text-white focus:ring-2 focus:ring-[var(--p-primary-400)]': isDarkMode
        }"
      />

      <!-- ✅ Login Button -->
      <button
        @click="login"
        class="w-full p-3 font-medium rounded-lg transition-all duration-300"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        Log In
      </button>

      <!-- ✅ Divider -->
      <div class="my-4 text-center text-sm text-gray-400">OR</div>

      <!-- ✅ Google Login -->
      <button
        @click="loginWithGoogle"
        class="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
        :class="{
          'bg-red-500 text-white hover:bg-red-600': !isDarkMode,
          'bg-red-700 text-white hover:bg-red-800': isDarkMode
        }"
      >
        <i class="pi pi-google"></i> Login with Google
      </button>

      <!-- ✅ Forgot Password -->
      <p class="text-center text-sm mt-4">
        <button @click="isResetPasswordModalOpen = true" class="text-blue-500 hover:underline">Forgot your password?</button>
      </p>

      <!-- ✅ Error Message -->
      <p v-if="errorMessage" class="text-center text-red-500 mt-3">❌ {{ filteredErrorMessage }}</p>
        </div>
    </div>

      <!-- ✅ Show Reset Password Modal -->
  <Modal v-if="isResetPasswordModalOpen" :modalComponent="ResetPasswordModal" @close="isResetPasswordModalOpen = false" />
</template>

<script setup>
import { ref, inject, computed, defineEmits } from "vue";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ResetPasswordModal from "@/components/modals/ResetPasswordModal.vue";
import Modal from "@/components/Modal.vue";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isDarkMode = inject("isDarkMode"); // ✅ Inject dark mode state
const isLoading = ref(false);
const isResetPasswordModalOpen = ref(false);

const emit = defineEmits(["close"]);

// ✅ Computed Property: Remove phone-related error messages
const filteredErrorMessage = computed(() => {
  if (!errorMessage.value) return "";
  return errorMessage.value.replace("missing email or phone", "Please enter your email.");
});

// ✅ Login with email
async function login() {
  isLoading.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) {
    errorMessage.value = error.message;
    isLoading.value = false;
  } else {
    errorMessage.value = "";
    emit("close");
  }
}

// ✅ Google OAuth login
async function loginWithGoogle() {
  const redirectUrl = process.env.NODE_ENV === 'production'
    ? 'https://watermelon-music.vercel.app/'
    : 'http://localhost:5173/';

  const { error } = await supabase.auth.signInWithOAuth(
    { provider: "google" },
    { redirectTo: redirectUrl }
  );
  if (error) {
    errorMessage.value = error.message;
  }
}

// ✅ Forgot Password
function showResetPassword() {
  console.log("🔑 Show reset password modal (implement this)");
}
</script>
