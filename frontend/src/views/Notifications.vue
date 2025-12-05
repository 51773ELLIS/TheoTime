<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage your notifications
        </p>
      </div>
      <button
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="btn btn-secondary"
        :disabled="loading"
      >
        Mark All as Read
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <button
          @click="filter = 'all'"
          :class="filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'"
        >
          All
        </button>
        <button
          @click="filter = 'unread'"
          :class="filter === 'unread' ? 'btn btn-primary' : 'btn btn-secondary'"
        >
          Unread ({{ unreadCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2">Loading notifications...</p>
    </div>

    <!-- Notifications List -->
    <div v-else-if="filteredNotifications.length > 0" class="space-y-3">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="card"
        :class="{ 'opacity-75': notification.read }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ notification.title }}</h3>
              <span
                v-if="!notification.read"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                New
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getNotificationTypeColor(notification.type)"
              >
                {{ formatNotificationType(notification.type) }}
              </span>
            </div>
            <p v-if="notification.message" class="text-gray-600 dark:text-gray-400 mb-2">
              {{ notification.message }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(notification.created_at) }}
            </p>
          </div>
          <div class="flex space-x-2 ml-4">
            <button
              v-if="!notification.read"
              @click="markAsRead(notification.id)"
              class="btn btn-secondary text-sm"
              :disabled="loading"
            >
              Mark Read
            </button>
            <button
              @click="deleteNotification(notification.id)"
              class="btn btn-danger text-sm"
              :disabled="loading"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">
        {{ filter === 'unread' ? 'No unread notifications' : 'No notifications' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';

const loading = ref(false);
const notifications = ref([]);
const filter = ref('all');

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return notifications.value.filter(n => !n.read);
  }
  return notifications.value;
});

onMounted(() => {
  loadNotifications();
});

const loadNotifications = async () => {
  loading.value = true;
  try {
    const response = await api.get('/notifications');
    notifications.value = response.data;
  } catch (error) {
    console.error('Failed to load notifications:', error);
  } finally {
    loading.value = false;
  }
};

const markAsRead = async (id) => {
  try {
    await api.put(`/notifications/${id}/read`);
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = 1;
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

const markAllAsRead = async () => {
  loading.value = true;
  try {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => {
      n.read = 1;
    });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  } finally {
    loading.value = false;
  }
};

const deleteNotification = async (id) => {
  if (!confirm('Are you sure you want to delete this notification?')) {
    return;
  }
  
  try {
    await api.delete(`/notifications/${id}`);
    notifications.value = notifications.value.filter(n => n.id !== id);
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const formatNotificationType = (type) => {
  const types = {
    event_reminder: 'Event Reminder',
    homework_overdue: 'Homework Overdue',
    homework_assigned: 'Homework Assigned',
    goal_reminder: 'Goal Reminder',
    other: 'Notification'
  };
  return types[type] || type;
};

const getNotificationTypeColor = (type) => {
  const colors = {
    event_reminder: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    homework_overdue: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    homework_assigned: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    goal_reminder: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  };
  return colors[type] || colors.other;
};
</script>
