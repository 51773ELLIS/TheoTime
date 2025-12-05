<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Worship Planner</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Plan and log your Family Worship sessions
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button @click="showTemplateModal = true" class="btn btn-secondary w-full sm:w-auto">
          Templates
        </button>
        <button @click="showPlanModal = true" class="btn btn-primary w-full sm:w-auto">
          + New Plan
        </button>
      </div>
    </div>

    <!-- Active Worship Plans -->
    <div v-if="activePlans.length === 0 && completedPlans.length === 0" class="card text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No worship plans yet.</p>
      <p class="mt-2">Click "+ New Plan" to create your first worship plan.</p>
    </div>
    
    <div v-if="activePlans.length > 0">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Plans</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div
          v-for="plan in activePlans"
          :key="plan.id"
          class="card cursor-pointer hover:shadow-lg transition-shadow"
          @click="viewPlan(plan)"
        >
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ plan.title }}</h3>
          <span v-if="plan.event_title" class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(plan.event_title) }}
          </span>
        </div>
        <div v-if="plan.bible_reading" class="mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Bible Reading:</span>
          <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">{{ plan.bible_reading }}</span>
        </div>
        <div class="flex space-x-2 mt-4">
          <button
            @click.stop="editPlan(plan)"
            class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Edit
          </button>
          <button
            @click.stop="logWorship(plan)"
            class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Log Session
          </button>
          <button
            @click.stop="deletePlan(plan)"
            class="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
      </div>
    </div>

    <!-- Completed Worship Plans -->
    <div v-if="completedPlans.length > 0" class="mt-8">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Completed Plans</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div
          v-for="plan in completedPlans"
          :key="plan.id"
          class="card cursor-pointer opacity-60 hover:opacity-80 transition-opacity"
          @click="viewPlan(plan)"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ plan.title }}</h3>
            <span class="text-xs text-green-600 dark:text-green-400 font-medium">✓ Completed</span>
          </div>
          <div v-if="plan.bible_reading" class="mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Bible Reading:</span>
            <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">{{ plan.bible_reading }}</span>
          </div>
          <div v-if="plan.event_title" class="mb-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">Completed: {{ formatDate(plan.event_title) }}</span>
          </div>
          <div class="flex space-x-2 mt-4">
            <button
              @click.stop="viewPlan(plan)"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plan Modal -->
    <div v-if="showPlanModal" class="mobile-modal">
      <div class="mobile-modal-content max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">{{ editingPlan ? 'Edit Plan' : 'New Worship Plan' }}</h2>
        <form @submit.prevent="savePlan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="planForm.title" type="text" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bible Reading</label>
            <input v-model="planForm.bible_reading" type="text" class="input" placeholder="e.g., Matthew 5:1-12" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Links (JW.org)</label>
            <textarea
              v-model="videoLinksText"
              rows="3"
              class="input"
              placeholder="One link per line"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Song Links (JW.org)</label>
            <textarea
              v-model="songLinksText"
              rows="3"
              class="input"
              placeholder="One link per line"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activities</label>
            <textarea
              v-model="activitiesText"
              rows="4"
              class="input"
              placeholder="One activity per line"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea v-model="planForm.notes" rows="3" class="input"></textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Save</button>
            <button type="button" @click="closePlanModal" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Log Modal -->
    <div v-if="showLogModal" class="mobile-modal">
      <div class="mobile-modal-content max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">Log Worship Session</h2>
        <form @submit.prevent="saveLog" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What was covered</label>
            <textarea v-model="logForm.what_was_covered" rows="4" required class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participants</label>
            <input v-model="logForm.participants" type="text" class="input" placeholder="Comma-separated names" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reflections</label>
            <textarea v-model="logForm.reflections" rows="3" class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea v-model="logForm.notes" rows="3" class="input"></textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Save Log</button>
            <button type="button" @click="showLogModal = false" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/utils/api';

const plans = ref([]);
const showPlanModal = ref(false);
const showLogModal = ref(false);
const showTemplateModal = ref(false);
const editingPlan = ref(null);
const selectedPlanForLog = ref(null);

const activePlans = computed(() => {
  return plans.value.filter(plan => !plan.is_completed && !plan.event_completed);
});

const completedPlans = computed(() => {
  return plans.value.filter(plan => plan.is_completed || plan.event_completed);
});

const planForm = ref({
  title: '',
  bible_reading: '',
  video_links: [],
  song_links: [],
  activities: [],
  notes: ''
});

const videoLinksText = ref('');
const songLinksText = ref('');
const activitiesText = ref('');

const logForm = ref({
  worship_plan_id: null,
  event_id: null,
  participants: '',
  what_was_covered: '',
  reflections: '',
  notes: ''
});

onMounted(async () => {
  await loadPlans();
});

const loadPlans = async () => {
  try {
    const response = await api.get('/worship/plans');
    plans.value = response.data;
  } catch (error) {
    console.error('Failed to load plans:', error);
  }
};

const savePlan = async () => {
  try {
    const data = {
      ...planForm.value,
      video_links: videoLinksText.value.split('\n').filter(l => l.trim()),
      song_links: songLinksText.value.split('\n').filter(l => l.trim()),
      activities: activitiesText.value.split('\n').filter(l => l.trim())
    };

    if (editingPlan.value) {
      await api.put(`/worship/plans/${editingPlan.value.id}`, data);
    } else {
      await api.post('/worship/plans', data);
    }

    closePlanModal();
    await loadPlans();
  } catch (error) {
    console.error('Failed to save plan:', error);
    alert('Failed to save plan');
  }
};

const editPlan = (plan) => {
  editingPlan.value = plan;
  planForm.value = {
    title: plan.title,
    bible_reading: plan.bible_reading || '',
    video_links: plan.video_links ? JSON.parse(plan.video_links) : [],
    song_links: plan.song_links ? JSON.parse(plan.song_links) : [],
    activities: plan.activities ? JSON.parse(plan.activities) : [],
    notes: plan.notes || ''
  };
  videoLinksText.value = planForm.value.video_links.join('\n');
  songLinksText.value = planForm.value.song_links.join('\n');
  activitiesText.value = planForm.value.activities.join('\n');
  showPlanModal.value = true;
};

const logWorship = (plan) => {
  selectedPlanForLog.value = plan;
  logForm.value.worship_plan_id = plan.id;
  showLogModal.value = true;
};

const saveLog = async () => {
  try {
    await api.post('/worship/logs', logForm.value);
    showLogModal.value = false;
    alert('Worship session logged successfully');
  } catch (error) {
    console.error('Failed to save log:', error);
    alert('Failed to save log');
  }
};

const viewPlan = (plan) => {
  // Could open a detailed view
  editPlan(plan);
};

const closePlanModal = () => {
  showPlanModal.value = false;
  editingPlan.value = null;
  planForm.value = {
    title: '',
    bible_reading: '',
    video_links: [],
    song_links: [],
    activities: [],
    notes: ''
  };
  videoLinksText.value = '';
  songLinksText.value = '';
  activitiesText.value = '';
};

const deletePlan = async (plan) => {
  if (!confirm(`Are you sure you want to delete "${plan.title}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/worship/plans/${plan.id}`);
    await loadPlans();
  } catch (error) {
    console.error('Failed to delete plan:', error);
    alert('Failed to delete plan');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>
