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
      
      <!-- ✅ Menu (Shown for both logged-in & logged-out users) -->
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
            @click="handleMenuClick(goToSettings)" 
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
            @click="handleMenuClick(() => showLoginModal = true)" 
            class="block w-full text-left px-3 py-2 text-sm hover:rounded-t-lg"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log In
          </button>
          <button 
            @click="handleMenuClick(() => showSignUpModal = true)" 
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
    </div>

    <!-- ✅ Modals -->
    <LoginModal v-if="showLoginModal" @close="showLoginModal = false" />
    <SignUpModal v-if="showSignUpModal" @close="showSignUpModal = false" />
  </div>
</template>

  
  
  <script setup>
  import { ref, onMounted, onUnmounted, inject } from "vue";
  import { supabase } from "@/lib/supabaseClient";
  import LoginModal from "@/components/LoginModal.vue";
//   import SignUpModal from "@/components/SignUpModal.vue";
  
  const isDarkMode = inject("isDarkMode");
  const toggleDarkMode = inject("toggleDarkMode");
  
  const user = ref(null);
  const showUserMenu = ref(false);
  const showLoginModal = ref(false);
  const showSignUpModal = ref(false);

  const menuRef = ref(null);
  
  onMounted(async () => {
    const { data: session } = await supabase.auth.getSession();
    document.addEventListener("click", closeMenuOnOutsideClick);

    user.value = session?.user || null;
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
    });
  });

  onUnmounted(() => {
     document.removeEventListener("click", closeMenuOnOutsideClick);
    });

  async function logout() {
    await supabase.auth.signOut();
    user.value = null;
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
  function goToSettings() {
    console.log("⚙️ Navigate to Account Settings (Implement routing here)");
    showUserMenu.value = false;
  }
  </script>
  