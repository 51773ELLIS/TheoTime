<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center flex-1">
            <div class="flex-shrink-0 flex items-center">
              <router-link to="/" class="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                TheoTime
              </router-link>
            </div>
            <!-- Desktop menu -->
            <div class="hidden md:ml-6 md:flex md:space-x-4">
              <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors"
                :class="isActive(item.path) 
                  ? 'border-primary-500 text-gray-900 dark:text-gray-100' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'"
              >
                {{ item.name }}
              </router-link>
            </div>
          </div>
          <!-- Desktop user info and logout -->
          <div class="hidden md:flex md:items-center md:space-x-4">
            <SearchBar />
            <NotificationBell />
            <span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
              {{ authStore.user?.full_name || authStore.user?.username }}
            </span>
            <button
              @click="handleLogout"
              class="btn btn-secondary text-sm whitespace-nowrap"
            >
              Logout
            </button>
          </div>
          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-label="Toggle menu"
            >
              <svg v-if="!mobileMenuOpen" class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu (collapsible) -->
      <div v-show="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div class="pt-2 pb-3 space-y-1 px-4">
          <div class="px-3 py-2">
            <SearchBar />
          </div>
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="mobileMenuOpen = false"
            class="block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors rounded-md"
            :class="isActive(item.path)
              ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300'"
          >
            {{ item.name }}
          </router-link>
          <div class="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div class="px-3 mb-3">
              <div class="text-base font-medium text-gray-800 dark:text-gray-200">
                {{ authStore.user?.full_name || authStore.user?.username }}
              </div>
            </div>
            <button
              @click="handleLogout"
              class="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import SearchBar from '@/components/SearchBar.vue';
import NotificationBell from '@/components/NotificationBell.vue';
import { requestNotificationPermission, startNotificationPolling } from '@/composables/useNotifications';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mobileMenuOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  mobileMenuOpen.value = false;
  router.push('/login');
};

const navItems = computed(() => {
  const items = [
    { path: '/', name: 'Dashboard' },
    { path: '/calendar', name: 'Calendar' },
    { path: '/worship', name: 'Worship' },
    { path: '/homework', name: 'Homework' },
    { path: '/children', name: 'Children' }
  ];

  if (authStore.isParent) {
    items.push({ path: '/ai', name: 'AI Assistant' });
    items.push({ path: '/analytics', name: 'Analytics' });
  }

  items.push({ path: '/settings', name: 'Settings' });

  return items;
});

const isActive = (path) => {
  return route.path === path || (path !== '/' && route.path.startsWith(path));
};

// Request notification permission and start polling on mount
let stopPolling = null;
onMounted(async () => {
  await requestNotificationPermission();
  stopPolling = startNotificationPolling();
});

onUnmounted(() => {
  if (stopPolling) {
    stopPolling();
  }
});
</script>
