<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Family Worship Night
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              {{ plan?.title || 'Loading...' }}
            </p>
          </div>
          <button
            @click="exitSession"
            class="btn btn-secondary text-sm"
          >
            Exit Session
          </button>
        </div>
        <div v-if="event" class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(event.start_date) }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Loading worship plan...</p>
      </div>

      <!-- Session Dashboard -->
      <div v-else-if="plan" class="space-y-6">
        <!-- Progress Indicator -->
        <div class="card bg-white dark:bg-gray-800">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Session Progress</h2>
            <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
              {{ completedSteps }} / {{ totalSteps }} Complete
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              class="bg-primary-600 h-3 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Bible Reading Section -->
        <div v-if="plan.bible_reading" class="card bg-white dark:bg-gray-800">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Bible Reading</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Read and discuss together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="sessionProgress.bibleReading"
                @change="updateProgress"
                class="w-6 h-6 text-primary-600 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Complete</span>
            </label>
          </div>
          <div class="ml-13">
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {{ plan.bible_reading }}
            </p>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discussion Notes
              </label>
              <textarea
                v-model="sessionNotes.bibleReading"
                rows="3"
                class="input"
                placeholder="Jot down key points or questions that came up..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Songs Section -->
        <div v-if="songLinks && songLinks.length > 0" class="card bg-white dark:bg-gray-800">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Songs</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Sing together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="sessionProgress.songs"
                @change="updateProgress"
                class="w-6 h-6 text-primary-600 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Complete</span>
            </label>
          </div>
          <div class="ml-13 space-y-3">
            <div
              v-for="(song, index) in songLinks"
              :key="index"
              class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <a
                :href="song"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Song {{ index + 1 }} - Open on JW.org
              </a>
            </div>
          </div>
        </div>

        <!-- Videos Section -->
        <div v-if="videoLinks && videoLinks.length > 0" class="card bg-white dark:bg-gray-800">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Videos</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Watch and discuss</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="sessionProgress.videos"
                @change="updateProgress"
                class="w-6 h-6 text-primary-600 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Complete</span>
            </label>
          </div>
          <div class="ml-13 space-y-3">
            <div
              v-for="(video, index) in videoLinks"
              :key="index"
              class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <a
                :href="video"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Video {{ index + 1 }} - Open on JW.org
              </a>
            </div>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video Discussion Notes
              </label>
              <textarea
                v-model="sessionNotes.videos"
                rows="3"
                class="input"
                placeholder="What did you learn? What questions came up?"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Activities Section -->
        <div v-if="activities && activities.length > 0" class="card bg-white dark:bg-gray-800">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Activities</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Engage together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="sessionProgress.activities"
                @change="updateProgress"
                class="w-6 h-6 text-primary-600 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Complete</span>
            </label>
          </div>
          <div class="ml-13 space-y-4">
            <div
              v-for="(activity, index) in activities"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-start">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  {{ index + 1 }}
                </span>
                <p class="text-gray-900 dark:text-white flex-1">{{ activity }}</p>
              </div>
            </div>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Notes
              </label>
              <textarea
                v-model="sessionNotes.activities"
                rows="3"
                class="input"
                placeholder="How did the activities go? What did the family enjoy?"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Additional Notes Section -->
        <div v-if="plan.notes" class="card bg-white dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Additional Notes</h3>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ plan.notes }}</p>
        </div>

        <!-- Session Notes -->
        <div class="card bg-white dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Notes</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Participants
              </label>
              <input
                v-model="sessionNotes.participants"
                type="text"
                class="input"
                placeholder="Who participated in tonight's worship?"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overall Reflections
              </label>
              <textarea
                v-model="sessionNotes.reflections"
                rows="4"
                class="input"
                placeholder="How did the session go? What were the highlights?"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thoughts for Future Sessions
              </label>
              <textarea
                v-model="sessionNotes.futureThoughts"
                rows="3"
                class="input"
                placeholder="Ideas or topics for upcoming worship nights..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Complete Session Button -->
        <div class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-lg">
          <button
            @click="completeSession"
            class="w-full btn btn-primary text-lg py-4"
            :disabled="completing"
          >
            <span v-if="completing">Completing Session...</span>
            <span v-else>✓ Complete Family Worship Session</span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="card text-center py-12">
        <p class="text-red-600 dark:text-red-400 mb-4">Failed to load worship plan</p>
        <button @click="exitSession" class="btn btn-secondary">Go Back</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const completing = ref(false);
const plan = ref(null);
const event = ref(null);
const sessionProgress = ref({
  bibleReading: false,
  songs: false,
  videos: false,
  activities: false
});
const sessionNotes = ref({
  bibleReading: '',
  videos: '',
  activities: '',
  participants: '',
  reflections: '',
  futureThoughts: ''
});

const songLinks = computed(() => {
  if (!plan.value?.song_links) return [];
  try {
    return typeof plan.value.song_links === 'string' 
      ? JSON.parse(plan.value.song_links) 
      : plan.value.song_links;
  } catch {
    return [];
  }
});

const videoLinks = computed(() => {
  if (!plan.value?.video_links) return [];
  try {
    return typeof plan.value.video_links === 'string' 
      ? JSON.parse(plan.value.video_links) 
      : plan.value.video_links;
  } catch {
    return [];
  }
});

const activities = computed(() => {
  if (!plan.value?.activities) return [];
  try {
    return typeof plan.value.activities === 'string' 
      ? JSON.parse(plan.value.activities) 
      : plan.value.activities;
  } catch {
    return [];
  }
});

const totalSteps = computed(() => {
  let count = 0;
  if (plan.value?.bible_reading) count++;
  if (songLinks.value.length > 0) count++;
  if (videoLinks.value.length > 0) count++;
  if (activities.value.length > 0) count++;
  return count || 1; // At least 1 step
});

const completedSteps = computed(() => {
  let count = 0;
  if (sessionProgress.value.bibleReading && plan.value?.bible_reading) count++;
  if (sessionProgress.value.songs && songLinks.value.length > 0) count++;
  if (sessionProgress.value.videos && videoLinks.value.length > 0) count++;
  if (sessionProgress.value.activities && activities.value.length > 0) count++;
  return count;
});

const progressPercentage = computed(() => {
  return totalSteps.value > 0 ? (completedSteps.value / totalSteps.value) * 100 : 0;
});

onMounted(async () => {
  const eventId = route.query.event_id;
  const planId = route.query.plan_id;

  if (!eventId && !planId) {
    router.push('/worship');
    return;
  }

  await loadSessionData(eventId, planId);
});

const loadSessionData = async (eventId, planId) => {
  loading.value = true;
  try {
    // Load event if eventId provided
    if (eventId) {
      try {
        const eventResponse = await api.get(`/events/${eventId}`);
        event.value = eventResponse.data;
        
        // Use worship_plan_id from event, or fallback to planId from query
        const planIdToLoad = eventResponse.data.worship_plan_id || planId;
        
        if (planIdToLoad) {
          const planResponse = await api.get(`/worship/plans/${planIdToLoad}`);
          plan.value = planResponse.data;
        } else {
          throw new Error('No worship plan found for this event');
        }
      } catch (error) {
        console.error('Failed to load event:', error);
        // If event load fails but we have planId, try loading plan directly
        if (planId) {
          const planResponse = await api.get(`/worship/plans/${planId}`);
          plan.value = planResponse.data;
        } else {
          throw error;
        }
      }
    } else if (planId) {
      // Load plan directly
      const planResponse = await api.get(`/worship/plans/${planId}`);
      plan.value = planResponse.data;
    } else {
      throw new Error('No event ID or plan ID provided');
    }

    if (!plan.value) {
      alert('Worship plan not found. Please make sure a plan is assigned to this event.');
      router.push('/worship');
    }
  } catch (error) {
    console.error('Failed to load session data:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to load worship session';
    alert(`Error: ${errorMessage}`);
    router.push('/worship');
  } finally {
    loading.value = false;
  }
};

const updateProgress = () => {
  // Progress is automatically computed
};

const completeSession = async () => {
  if (!confirm('Are you ready to complete this family worship session?')) {
    return;
  }

  completing.value = true;
  try {
    const data = {
      worship_plan_id: plan.value.id,
      event_id: event.value?.id || null,
      participants: sessionNotes.value.participants,
      what_was_covered: `Bible Reading: ${plan.value.bible_reading || 'N/A'}\n\nNotes:\n${sessionNotes.value.bibleReading}\n\nVideo Notes:\n${sessionNotes.value.videos}\n\nActivity Notes:\n${sessionNotes.value.activities}`,
      reflections: sessionNotes.value.reflections,
      future_thoughts: sessionNotes.value.futureThoughts,
      notes: `Bible Reading Complete: ${sessionProgress.value.bibleReading}\nSongs Complete: ${sessionProgress.value.songs}\nVideos Complete: ${sessionProgress.value.videos}\nActivities Complete: ${sessionProgress.value.activities}`,
      is_completed: true
    };

    if (event.value?.id) {
      // Complete via event endpoint
      await api.put(`/events/${event.value.id}/complete`, {
        worship_plan_id: plan.value.id,
        participants: sessionNotes.value.participants,
        what_was_covered: data.what_was_covered,
        reflections: sessionNotes.value.reflections,
        notes: sessionNotes.value.futureThoughts,
        future_thoughts: sessionNotes.value.futureThoughts
      });
    } else {
      // Create worship log
      await api.post('/worship/logs', data);
    }

    alert('Family worship session completed successfully!');
    router.push('/worship');
  } catch (error) {
    console.error('Failed to complete session:', error);
    alert(error.response?.data?.error || 'Failed to complete session');
  } finally {
    completing.value = false;
  }
};

const exitSession = () => {
  if (confirm('Are you sure you want to exit? Your progress will be saved but the session will not be marked as complete.')) {
    router.push('/worship');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    ...(dateString.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {})
  });
};
</script>
