<template>
  <div class="space-y-4 sm:space-y-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        View insights and statistics about your family's spiritual activities
      </p>
    </div>

    <!-- Date Range Selector -->
    <div class="card">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          @click="loadAnalytics"
          class="btn btn-primary"
          :disabled="loading"
        >
          Update
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2">Loading analytics...</p>
    </div>

    <!-- Analytics Content -->
    <div v-else-if="analytics">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Events</h3>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ analytics.events?.total || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ analytics.events?.completed || 0 }} completed
          </p>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Homework</h3>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ analytics.homework?.total || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ analytics.homework?.completed || 0 }} completed, {{ analytics.homework?.overdue || 0 }} overdue
          </p>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Worship Completion</h3>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {{ analytics.worship?.completion_rate || 0 }}%
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ analytics.worship?.completed || 0 }} of {{ analytics.worship?.total || 0 }} events
          </p>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Spiritual Goals</h3>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ analytics.spiritual_goals?.total || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ analytics.spiritual_goals?.completed || 0 }} completed
          </p>
        </div>
      </div>

      <!-- Event Types Breakdown -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Types</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Worship</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ analytics.events?.worship_events || 0 }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Personal Study</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ analytics.events?.study_events || 0 }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Meetings</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ analytics.events?.meeting_events || 0 }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ministry</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ analytics.events?.ministry_events || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Activity by User -->
      <div v-if="analytics.activity_by_user && analytics.activity_by_user.length > 0" class="card">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity by User</h2>
        <div class="space-y-3">
          <div
            v-for="user in analytics.activity_by_user"
            :key="user.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ user.username }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.role }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Events: {{ user.event_count || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Homework: {{ user.homework_count || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Completed: {{ user.completed_events || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div v-if="analytics.recent_activity && analytics.recent_activity.length > 0" class="card">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div class="space-y-2">
          <div
            v-for="activity in analytics.recent_activity"
            :key="`${activity.type}-${activity.id}`"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ activity.username }} • {{ formatDate(activity.date) }}
                </p>
              </div>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="activity.type === 'event' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'"
              >
                {{ activity.type }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

const loading = ref(false);
const analytics = ref(null);
const startDate = ref('');
const endDate = ref('');

onMounted(() => {
  // Set default date range (last 30 days)
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  endDate.value = end.toISOString().split('T')[0];
  startDate.value = start.toISOString().split('T')[0];
  
  loadAnalytics();
});

const loadAnalytics = async () => {
  loading.value = true;
  try {
    const params = {};
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    
    const response = await api.get('/analytics', { params });
    analytics.value = response.data;
  } catch (error) {
    console.error('Failed to load analytics:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    ...(dateString.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {})
  });
};
</script>
