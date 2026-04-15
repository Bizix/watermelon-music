<template>
  <div class="relative flex flex-col items-center gap-4 px-3 py-5 text-center sm:gap-2 sm:px-5 sm:py-6">
    <h1
      class="max-w-[12ch] text-3xl font-extrabold leading-none tracking-tight sm:max-w-none sm:text-[2.2rem]"
      :style="{ color: 'var(--p-primary-color)' }"
    >
      WaterMelon Music
    </h1>

    <div class="flex w-full flex-wrap items-center justify-center gap-3 sm:absolute sm:right-5 sm:top-5 sm:w-auto sm:justify-end">
      <button
        @click="toggleDarkMode"
        class="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
        :class="{
          'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
          'bg-[var(--p-surface-100)] text-[var(--p-text-primary)] hover:bg-[var(--p-surface-200)]': isDarkMode
        }"
        aria-label="Toggle dark mode"
      >
        <i v-if="isDarkMode" class="pi pi-moon text-base sm:text-lg"></i>
        <i v-else class="pi pi-sun text-base sm:text-lg"></i>
      </button>

      <div class="relative" ref="menuRef">
        <button
          @click="toggleUserMenu"
          class="min-w-28 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300"
          :class="{
            'bg-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-400)]': !isDarkMode,
            'bg-[var(--p-surface-100)] text-[var(--p-text-primary)] hover:bg-[var(--p-surface-200)]': isDarkMode
          }"
        >
          Menu
        </button>

        <div
          v-if="showUserMenu && user"
          class="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl shadow-md"
          :class="{
            'bg-[var(--p-surface-50)] text-black': !isDarkMode,
            'bg-[var(--p-surface-100)] text-white': isDarkMode
          }"
        >
          <button
            @click="handleMenuClick(toggleRoute)"
            class="block w-full px-3 py-2 text-left text-sm hover:rounded-t-xl"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            {{ buttonLabel }}
          </button>
          <button
            @click="openModal(SettingsModal)"
            class="block w-full px-3 py-2 text-left text-sm"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Account Settings
          </button>
          <button
            @click="handleMenuClick(logout)"
            class="block w-full px-3 py-2 text-left text-sm text-red-400 hover:rounded-b-xl"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log Out
          </button>
        </div>

        <div
          v-if="showUserMenu && !user"
          class="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl shadow-md"
          :class="{
            'bg-[var(--p-surface-50)] text-black': !isDarkMode,
            'bg-[var(--p-surface-100)] text-white': isDarkMode
          }"
        >
          <button
            @click="openModal(LoginModal)"
            class="block w-full px-3 py-2 text-left text-sm hover:rounded-t-xl"
            :class="{
              'hover:bg-gray-300': !isDarkMode,
              'dark:hover:bg-[var(--p-surface-500)]': isDarkMode
            }"
          >
            Log In
          </button>
          <button
            @click="openModal(SignUpModal)"
            class="block w-full px-3 py-2 text-left text-sm hover:rounded-b-xl"
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
import {
  computed,
  defineAsyncComponent,
  inject,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { supabase } from "@/lib/supabaseClient";
import emitter from "@/lib/emitter";
import { useRoute, useRouter } from "vue-router";

import Modal from "@/components/Modal.vue";

const LoginModal = defineAsyncComponent(() => import("@/components/modals/LoginModal.vue"));
const SignUpModal = defineAsyncComponent(() => import("@/components/modals/SignUpModal.vue"));
const SettingsModal = defineAsyncComponent(() => import("@/components/modals/SettingsModal.vue"));

const router = useRouter();
const route = useRoute();

const isDarkMode = inject("isDarkMode");
const toggleDarkMode = inject("toggleDarkMode");
const user = inject("user");

const showUserMenu = ref(false);
const activeModalComponent = ref(null);
const activeModalProps = ref({});
const menuRef = ref(null);

onMounted(() => {
  document.addEventListener("click", closeMenuOnOutsideClick);
  emitter.on("accountDeleted", handleAccountDeletion);
});

onUnmounted(() => {
  document.removeEventListener("click", closeMenuOnOutsideClick);
  emitter.off("accountDeleted", handleAccountDeletion);
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
  router.replace({ name: "Charts" });
}

async function handleAccountDeletion() {
  await supabase.auth.signOut();
  user.value = null;
  router.replace({ name: "Charts" });
}

function toggleUserMenu(event) {
  event.stopPropagation();
  showUserMenu.value = !showUserMenu.value;
}

const handleMenuClick = (action) => {
  showUserMenu.value = false;
  action();
};

function closeMenuOnOutsideClick(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
}

const buttonLabel = computed(() => (route.path === "/playlists" ? "Charts" : "Playlists"));

function toggleRoute() {
  const target = route.name === "Playlists" ? "Charts" : "Playlists";

  router.push({ name: target }).catch((err) => {
    if (err.name !== "NavigationDuplicated") {
      console.error(err);
    }
  });

  showUserMenu.value = false;
}
</script>
  
