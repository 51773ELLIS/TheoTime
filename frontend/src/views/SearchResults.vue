<template>
  <div class="space-y-4 sm:space-y-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Search</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Search across events, homework, worship plans, and spiritual goals
      </p>
    </div>

    <!-- Search Input -->
    <div class="card">
      <div class="flex gap-3">
        <input
          v-model="searchQuery"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Enter search query..."
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          @click="performSearch"
          class="btn btn-primary"
          :disabled="loading || !searchQuery.trim()"
        >
          Search
        </button>
      </div>
      
      <!-- Type Filters -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="type in searchTypes"
          :key="type.value"
          @click="selectedType = type.value"
          :class="selectedType === type.value ? 'btn btn-primary' : 'btn btn-secondary'"
          class="text-sm"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="mt-2">Searching...</p>
    </div>

    <!-- Results -->
    <div v-else-if="searchResults && searchQuery">
      <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Found {{ totalResults }} result{{ totalResults !== 1 ? 's' : '' }} for "{{ searchQuery }}"
      </div>

      <!-- Events Results -->
      <div v-if="searchResults.events.length > 0" class="card mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Events</h2>
        <div class="space-y-3">
          <div
            v-for="event in searchResults.events"
            :key="event.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            @click="navigateToEvent(event)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ event.title }}</h3>
                <p v-if="event.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ event.description }}</p>
                <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{{ formatDate(event.start_date) }}</span>
                  <span class="ml-3">{{ event.event_type }}</span>
                </div>
              </div>
              <span
                class="px-3 py-1 text-xs font-medium rounded-full ml-4"
                :class="getEventTypeColor(event.event_type)"
              >
                {{ event.event_type }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Homework Results -->
      <div v-if="searchResults.homework.length > 0" class="card mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Homework</h2>
        <div class="space-y-3">
          <div
            v-for="hw in searchResults.homework"
            :key="hw.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            @click="navigateToHomework(hw)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ hw.title }}</h3>
                <p v-if="hw.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ hw.description }}</p>
                <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="hw.due_date">Due: {{ formatDate(hw.due_date) }}</span>
                  <span v-if="hw.assigned_to_username" class="ml-3">Assigned to: {{ hw.assigned_to_username }}</span>
                </div>
              </div>
              <span
                class="px-3 py-1 text-xs font-medium rounded-full ml-4"
                :class="hw.completed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'"
              >
                {{ hw.completed ? 'Completed' : 'Pending' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Worship Plans Results -->
      <div v-if="searchResults.worship_plans.length > 0" class="card mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Worship Plans</h2>
        <div class="space-y-3">
          <div
            v-for="plan in searchResults.worship_plans"
            :key="plan.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            @click="navigateToWorship(plan)"
          >
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ plan.title }}</h3>
              <p v-if="plan.bible_reading" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bible Reading: {{ plan.bible_reading }}
              </p>
              <p v-if="plan.notes" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ plan.notes }}</p>
              <div v-if="plan.event_title" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Event: {{ plan.event_title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spiritual Goals Results -->
      <div v-if="searchResults.spiritual_goals.length > 0" class="card mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Spiritual Goals</h2>
        <div class="space-y-3">
          <div
            v-for="goal in searchResults.spiritual_goals"
            :key="goal.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            @click="navigateToGoal(goal)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ goal.title }}</h3>
                <p v-if="goal.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ goal.description }}</p>
                <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Created: {{ formatDate(goal.created_at) }}
                </div>
              </div>
              <span
                class="px-3 py-1 text-xs font-medium rounded-full ml-4"
                :class="goal.completed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'"
              >
                {{ goal.completed ? 'Completed' : 'Active' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="totalResults === 0" class="card text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">No results found for "{{ searchQuery }}"</p>
      </div>
    </div>

    <!-- Initial State -->
    <div v-else class="card text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">Enter a search query to find events, homework, worship plans, and spiritual goals</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';

const route = useRoute();
const router = useRouter();

const searchQuery = ref('');
const selectedType = ref('all');
const loading = ref(false);
const searchResults = ref(null);

const searchTypes = [
  { value: 'all', label: 'All' },
  { value: 'events', label: 'Events' },
  { value: 'homework', label: 'Homework' },
  { value: 'worship_plans', label: 'Worship Plans' },
  { value: 'spiritual_goals', label: 'Spiritual Goals' }
];

const totalResults = computed(() => {
  if (!searchResults.value) return 0;
  return searchResults.value.total || 0;
});

onMounted(() => {
  // Check if there's a query parameter from the route
  if (route.query.q) {
    searchQuery.value = route.query.q;
    if (route.query.type) {
      selectedType.value = route.query.type;
    }
    performSearch();
  }
});

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  try {
    const params = { q: searchQuery.value.trim() };
    if (selectedType.value !== 'all') {
      params.type = selectedType.value;
    }

    const response = await api.get('/search', { params });
    searchResults.value = response.data.results;
    
    // Update URL without navigation
    router.replace({
      query: { q: searchQuery.value, ...(selectedType.value !== 'all' ? { type: selectedType.value } : {}) }
    });
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = {
      events: [],
      homework: [],
      worship_plans: [],
      spiritual_goals: []
    };
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

const navigateToEvent = (event) => {
  router.push(`/calendar?event=${event.id}`);
};

const navigateToHomework = (hw) => {
  router.push('/homework');
};

const navigateToWorship = (plan) => {
  router.push('/worship');
};

const navigateToGoal = (goal) => {
  router.push('/children');
};
</script>
