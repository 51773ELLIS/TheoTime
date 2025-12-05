<template>
  <div class="space-y-4 sm:space-y-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Welcome back, {{ authStore.user?.full_name || authStore.user?.username }}!
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Upcoming Events</h3>
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ upcomingEventsCount }}</p>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Homework</h3>
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ activeHomeworkCount }}</p>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Spiritual Goals</h3>
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{{ activeGoalsCount }}</p>
      </div>
    </div>

    <!-- Upcoming Events -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
        <router-link to="/calendar" class="text-primary-600 dark:text-primary-400 hover:underline text-sm">
          View all
        </router-link>
      </div>
      <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
      <div v-else-if="upcomingEvents.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        No upcoming events
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="event in upcomingEvents"
          :key="event.id"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ event.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(event.start_date) }} • {{ event.event_type }}
            </p>
          </div>
          <span
            class="px-3 py-1 text-xs font-medium rounded-full"
            :class="getEventTypeColor(event.event_type)"
          >
            {{ event.event_type }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Homework -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Active Homework</h2>
        <router-link to="/homework" class="text-primary-600 dark:text-primary-400 hover:underline text-sm">
          View all
        </router-link>
      </div>
      <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
      <div v-else-if="activeHomework.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        No active homework
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="hw in activeHomework"
          :key="hw.id"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ hw.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Due: {{ hw.due_date ? formatDate(hw.due_date) : 'No due date' }} • {{ hw.task_type }}
            </p>
          </div>
          <span class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            Pending
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <router-link
          to="/worship"
          class="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
        >
          <h3 class="font-semibold text-primary-900 dark:text-primary-100">Plan Worship</h3>
          <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">Create a new worship plan</p>
        </router-link>
        <router-link
          to="/calendar"
          class="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
        >
          <h3 class="font-semibold text-primary-900 dark:text-primary-100">View Calendar</h3>
          <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">See all events</p>
        </router-link>
        <router-link
          v-if="authStore.isParent"
          to="/ai"
          class="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
        >
          <h3 class="font-semibold text-primary-900 dark:text-primary-100">AI Assistant</h3>
          <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">Get suggestions</p>
        </router-link>
        <router-link
          to="/children"
          class="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
        >
          <h3 class="font-semibold text-primary-900 dark:text-primary-100">Children</h3>
          <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">View profiles</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';

const authStore = useAuthStore();
const loading = ref(true);
const upcomingEvents = ref([]);
const activeHomework = ref([]);
const activeGoals = ref([]);

const upcomingEventsCount = computed(() => upcomingEvents.value.length);
const activeHomeworkCount = computed(() => activeHomework.value.filter(hw => !hw.completed).length);
const activeGoalsCount = computed(() => activeGoals.value.filter(g => !g.completed).length);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, homeworkRes, goalsRes] = await Promise.all([
      api.get('/events', { params: { start: now, end: nextWeek } }),
      api.get('/homework', { params: { completed: false } }),
      api.get('/children/goals')
    ]);

    upcomingEvents.value = eventsRes.data.slice(0, 5);
    activeHomework.value = homeworkRes.data.slice(0, 5);
    activeGoals.value = goalsRes.data;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getEventTypeColor = (type) => {
  const colors = {
    worship: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    personal_study: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    meeting: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    ministry: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  };
  return colors[type] || colors.other;
};
</script>
