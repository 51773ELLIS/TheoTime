<template>
  <div class="relative" ref="containerRef">
    <button
      @click="showDropdown = !showDropdown"
      class="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
      aria-label="Notifications"
    >
      <svg
        class="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      ref="dropdownRef"
      class="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div v-if="loading" class="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
      <div v-else-if="notifications.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
        No notifications
      </div>
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="notification in notifications.slice(0, 10)"
          :key="notification.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          :class="{ 'bg-gray-50 dark:bg-gray-700': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ notification.title }}
              </p>
              <p v-if="notification.message" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ notification.message }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ formatTime(notification.created_at) }}
              </p>
            </div>
            <span
              v-if="!notification.read"
              class="ml-2 h-2 w-2 rounded-full bg-primary-500"
            ></span>
          </div>
        </div>
      </div>

      <div v-if="notifications.length > 0" class="p-3 border-t border-gray-200 dark:border-gray-700">
        <router-link
          to="/notifications"
          class="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
          @click="showDropdown = false"
        >
          View all notifications
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';

const router = useRouter();
const showDropdown = ref(false);
const loading = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const dropdownRef = ref(null);
const containerRef = ref(null);

let pollInterval = null;

const loadNotifications = async () => {
  try {
    const [notificationsRes, countRes] = await Promise.all([
      api.get('/notifications', { params: { unread_only: 'true' } }),
      api.get('/notifications/unread-count')
    ]);
    notifications.value = notificationsRes.data;
    unreadCount.value = countRes.data.count || 0;
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    await loadNotifications();
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    try {
      await api.put(`/notifications/${notification.id}/read`);
      notification.read = 1;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Navigate based on notification type
  if (notification.related_type === 'event' && notification.related_id) {
    router.push(`/calendar?event=${notification.related_id}`);
  } else if (notification.related_type === 'homework' && notification.related_id) {
    router.push('/homework');
  } else {
    router.push('/notifications');
  }
  showDropdown.value = false;
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Handle click outside
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target) && showDropdown.value) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  loadNotifications();
  // Poll for new notifications every 30 seconds
  pollInterval = setInterval(loadNotifications, 30000);
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  document.removeEventListener('click', handleClickOutside);
});
</script>
