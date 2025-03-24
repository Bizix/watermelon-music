<template>
  <!-- ✅ Header Section -->
  <div class="relative flex flex-col items-center my-6">
    <h1 
      class="text-3xl pb-2 font-extrabold text-center"
      :style="{ color: 'var(--p-primary-color)' }"
    >
      WaterMelon Music
    </h1>

    <!-- ✅ Controls Container -->
    <div class="flex items-center gap-4 mt-4 sm:mt-0 sm:absolute sm:right-4 sm:top-0">
      <!-- Dark Mode Toggle Button -->
      <button
        @click="toggleDarkMode"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-50)] text-white hover:bg-[var(--p-surface-100)]': isDarkMode
        }"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-base sm:text-lg"></i>
        <i v-else class="pi pi-sun text-base sm:text-lg"></i>
      </button>

      <!-- Menu Button -->
      <div class="relative" ref="menuRef">
        <button 
          @click="toggleUserMenu"
          class="px-4 py-2 rounded-lg transition-all duration-500"
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
            @click="handleMenuClick(toggleRoute)"
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-t-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            {{ buttonLabel }}
          </button>
          <button 
            @click="openModal(SettingsModal)"
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
            @click="openModal(LoginModal)" 
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-t-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log In
          </button>
          <button 
            @click="openModal(SignUpModal)" 
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
      @closeAll="logout"
    />
  </div>
</template>


  
  
  <script setup>
  import { ref, onMounted, onUnmounted, markRaw, inject, computed } from "vue";
  import { supabase } from "@/lib/supabaseClient";
  import emitter from "@/lib/emitter";
  import { useRouter, useRoute } from 'vue-router';

  import Modal from "@/components/Modal.vue";
  import LoginModal from "@/components/modals/LoginModal.vue";
  import SignUpModal from "@/components/modals/SignUpModal.vue";
  import SettingsModal from "@/components/modals/SettingsModal.vue";



  const router = useRouter();
  const route = useRoute();

  const isDarkMode = inject("isDarkMode");
  const toggleDarkMode = inject("toggleDarkMode");
  
  const user = inject("user");
  const showUserMenu = ref(false);
  const activeModalComponent = ref(null);
  const activeModalProps = ref({});
  const menuRef = ref(null);
  
  let authUnsubscribe = null;

  onMounted(async () => {
    document.addEventListener("click", closeMenuOnOutsideClick);

      // ✅ Listen for account deletion event
    emitter.on("accountDeleted", handleAccountDeletion);

    authUnsubscribe = supabase.auth.onAuthStateChange((_event, session) => {
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

const buttonLabel = computed(() => route.path === '/playlists' ? 'Charts' : 'Playlists');

function toggleRoute() {
      if (route.path === '/playlists') {
        router.push('/');
      } else {
        router.push('/playlists');
      }
      showUserMenu.value = false;
    }

  </script>
  