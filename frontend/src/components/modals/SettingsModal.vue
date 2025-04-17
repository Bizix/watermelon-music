<!-- component/modals/SettingsModal.vue -->
<template>
  <!-- ✅ Prevent rendering until isLoading is false -->
  <div v-if="!isLoading && !isSettingsHidden" class="relative w-96 p-6 rounded-lg shadow-lg transition-all duration-300 border"
    :class="{
      'bg-white text-black border-gray-300': !isDarkMode,
      'bg-black text-white border-[var(--p-primary-400)]': isDarkMode
    }">
    
    <!-- Close Button -->
    <button @click="$emit('close')" class="absolute right-3 top-3 text-lg" aria-label="close">
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
    <button   v-if="!isSpotifyConnected"
    @click="handleConnectSpotify" class="w-full px-4 py-2 font-medium rounded-lg transition-all duration-300"
      :class="{
        'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
        'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
      }">
      Link Spotify Account
    </button>
    
    <!-- Change Password (Only for Email Users) -->
    <button v-if="!isOAuthUser" @click="openModal(ChangePasswordModal)"
      class="w-full px-4 py-2 font-medium rounded-lg mt-4 transition-all duration-300"
      :class="{
        'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
        'bg-[var(--p-surface-50)] hover:bg-[var(--p-surface-100)]': isDarkMode
      }">
      Change Password
    </button>
    
    <!-- Delete Account -->
    <button
      @click="openModal(DeletionConfirmationModal, {
        title: 'Delete Account',
        message: 'Are you sure you want to delete your account? All associated playlist data will also be deleted.',
        confirmText: 'Delete',
        action: deleteAccount
      })"
      class="w-full px-4 py-2 font-medium rounded-lg mt-4 text-red-500 border border-red-400 transition-all duration-300"
      :class="{
        'hover:bg-red-100': !isDarkMode,
        'hover:bg-red-900': isDarkMode
      }"
    >
      Delete Account
    </button>
  </div>

  <!-- ✅ Modals -->
  <Modal 
    v-if="activeModalComponent"
    :modalComponent="activeModalComponent"
    :modalProps="activeModalProps"
    @close="closeModal"
    @closeAll="closeModal"
  />
</template>

<script setup>
import { inject, ref, defineEmits, markRaw, onMounted } from "vue";
import { supabase } from "@/lib/supabaseClient"; 
import Modal from "@/components/Modal.vue";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal.vue";
import DeletionConfirmationModal from "./DeletionConfirmationModal.vue";

const emit = defineEmits(["close"]);

const isSpotifyConnected = inject("isSpotifyConnected");
const isDarkMode = inject("isDarkMode");
const activeModalComponent = ref(null);
const activeModalProps = ref({});
const isSettingsHidden = ref(false);
const isOAuthUser = ref(false); 
const user = inject("user");
const isLoading = ref(true); // ✅ Track loading state

onMounted(async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
  } else {
    isOAuthUser.value = user?.app_metadata?.provider !== "email"; // ✅ Set correct value
  }
  isLoading.value = false; // ✅ Done loading
});

function openModal(component, props = {}) {
  activeModalComponent.value = markRaw(component);
  activeModalProps.value = props;
  isSettingsHidden.value = true;
}

function closeModal() {
  activeModalComponent.value = null;
  isSettingsHidden.value = false;
  emit("close");
}

async function handleConnectSpotify() {
  if (!user?.value?.id) {
    console.warn("🛑 User not logged in");
    return;
  }

  const currentPath = window.location.pathname;
  const loginUrl = `${import.meta.env.VITE_API_BASE_URL}/api/spotify/login?from=${encodeURIComponent(currentPath)}&user_id=${user.value.id}`;

  window.location.href = loginUrl;
}

async function deleteAccount() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    console.error("User not found or error:", userError);
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) return;

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId: user.id }),
  });

  const result = await res.json();
  if (!res.ok || result.error) {
    console.error("❌ Failed to delete:", result.error);
    return;
  }

  await supabase.auth.signOut();
  emit("closeAll");
}
</script>