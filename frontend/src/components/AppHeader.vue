<template>
  <!-- ✅ Header Section -->
  <div class="relative flex flex-col items-center my-6">
    <h1 
      class="text-3xl font-extrabold text-center"
      :style="{ color: 'var(--p-primary-color)' }"
    >
      WaterMelon Music
    </h1>

    <!-- ✅ Right-side Controls -->
    <div class="absolute right-4 top-0 flex items-center gap-4">

         

      <!-- ✅ Theme Toggle -->
      <button
        @click="toggleDarkMode"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-lg"></i>
        <i v-else class="pi pi-sun text-lg"></i>
      </button>
      
      <!-- ✅ Menu -->
      <div class="relative" ref="menuRef">
        <button 
          @click="toggleUserMenu"
          class="px-4 py-2 rounded-lg transition-all duration-300"
          :class="{
            'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
            'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
          }"
        >
          Menu
        </button>

        <!-- ✅ User Menu (Logged In) -->
        <div 
          v-if="showUserMenu && user" 
          class="absolute right-0 mt-2 w-40 shadow-md rounded-lg overflow-hidden"
          :class="{
            'bg-[var(--p-surface-50)] text-black': !isDarkMode,
            'bg-[var(--p-surface-100)] text-white': isDarkMode
          }"
        >
          <button 
            @click="handleMenuClick(goToPlaylists)" 
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-t-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Playlists
          </button>
          <button 
          @click="openModal(SettingsView)"
            class="block w-full text-left px-3 py-2 text-sm"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Account Settings
          </button>
          <button 
            @click="handleMenuClick(logout)" 
            class="block w-full text-left px-3 py-2 text-sm text-red-400 hover:rounded-b-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log Out
          </button>
        </div>

        <!-- ✅ User Menu (Logged Out) -->
        <div 
          v-if="showUserMenu && !user" 
          class="absolute right-0 mt-2 w-40 shadow-md rounded-lg overflow-hidden"
          :class="{
            'bg-[var(--p-surface-50)] text-black': !isDarkMode,
            'bg-[var(--p-surface-100)] text-white': isDarkMode
          }"
        >
          <button 
            @click="openModal(LoginView)" 
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-t-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log In
          </button>
          <button 
            @click="openModal(SignUpView)" 
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-b-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ Modals -->
    <Modal 
        v-if="activeModalComponent"
        :modalComponent="activeModalComponent"
        :modalProps="activeModalProps"
        @close="closeModal"
        @closeAll="handleLogout"
    />
  </div>
</template>

  
  
  <script setup>
  import { ref, onMounted, onUnmounted, markRaw, inject } from "vue";
  import { supabase } from "@/lib/supabaseClient";
  import emitter from "@/lib/emitter";

  import Modal from "@/components/Modal.vue";
  import LoginView from "@/views/LoginView.vue";
  import SignUpView from "@/views/SignUpView.vue";
  import SettingsView from "@/views/SettingsView.vue";




  const isDarkMode = inject("isDarkMode");
  const toggleDarkMode = inject("toggleDarkMode");
  
  const user = ref(null);
  const showUserMenu = ref(false);
  const showLoginModal = ref(false);
  const showSignUpModal = ref(false);
  const activeModalComponent = ref(null);
  const activeModalProps = ref({});
  const menuRef = ref(null);
  
  let authListener;
  let authUnsubscribe = null;

  onMounted(async () => {
    await refreshUserState();

    document.addEventListener("click", closeMenuOnOutsideClick);

      // ✅ Listen for account deletion event
    emitter.on("accountDeleted", handleAccountDeletion);

    authUnsubscribe = supabase.auth.onAuthStateChange((_event, session) => {
    console.log("🔄 Auth state changed:", session);
    user.value = session?.user || null; // ✅ Update user state
  });
  });

  onUnmounted(() => {
    document.removeEventListener("click", closeMenuOnOutsideClick);

    emitter.off("accountDeleted", handleAccountDeletion);
    // ✅ Properly unsubscribe if authListener exists
    if (authListener && typeof authListener.unsubscribe === "function") {
      authListener.unsubscribe(); 
    }
  });

  function openModal(component, props = {}) {
    activeModalComponent.value = markRaw(component);
    activeModalProps.value = props;
    showUserMenu.value = false;
 }
  function closeModal() {
    activeModalComponent.value = null;
    activeModalProps.value = {};
 }
  
  async function logout() {
    await supabase.auth.signOut();
    await refreshUserState();
  }

  async function handleLogout() {
  console.log("🔒 User logged out, updating state...");
  activeModalComponent.value = null;
  await refreshUserState();
  closeModal();
}

async function refreshUserState() {
  console.log("🔄 Refreshing user state...");
  const { data: session, error } = await supabase.auth.getSession();
  if (error) console.error("Error fetching session:", error);
  user.value = session?.user || null;
  console.log("✅ User state updated:", user.value);
}

async function handleAccountDeletion() {
  console.log("🗑️ Account deleted, updating auth state...");

  // ✅ Force a full auth state reset
  await supabase.auth.signOut();
  await refreshUserState(); // Ensure user is null

  console.log("🚪 User should now be logged out.");
}

  function toggleUserMenu(event) {
  event.stopPropagation(); // Prevent immediate closing when clicking the button
  showUserMenu.value = !showUserMenu.value;
}

  const handleMenuClick = (action) => {
    showUserMenu.value = false; // ✅ Collapse menu
    action(); // ✅ Run the clicked action (e.g., navigation, login modal)
  };

  function closeMenuOnOutsideClick(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
}


  function goToPlaylists() {
    console.log("📂 Navigate to Playlists (Implement routing here)");
    showUserMenu.value = false;
  }
  </script>
  