<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get AI-powered suggestions for worship plans and activities
      </p>
    </div>

    <!-- AI Status -->
    <div v-if="!aiEnabled" class="card bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700">
      <p class="text-yellow-800 dark:text-yellow-200">
        AI Assistant is disabled. Please configure your OpenAI API key in Settings.
      </p>
    </div>

    <!-- Worship Plan Generator -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Generate Worship Plan</h2>
      <form @submit.prevent="generateWorshipPlan" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
            <input v-model.number="worshipForm.age" type="number" min="0" max="120" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme (optional)</label>
            <input v-model="worshipForm.theme" type="text" class="input" placeholder="e.g., Kindness, Love, Faith" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interests (optional)</label>
          <textarea v-model="worshipForm.interests" rows="2" class="input" placeholder="e.g., Animals, Nature, Music"></textarea>
        </div>
        <button type="submit" :disabled="generating" class="btn btn-primary">
          {{ generating ? 'Generating...' : 'Generate Plan' }}
        </button>
      </form>

      <div v-if="generatedPlan" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="text-lg font-semibold mb-3">{{ generatedPlan.title || 'Generated Worship Plan' }}</h3>
        <div v-if="generatedPlan.bible_reading" class="mb-3">
          <p class="font-medium text-gray-700 dark:text-gray-300">Bible Reading:</p>
          <p class="text-gray-600 dark:text-gray-400">{{ generatedPlan.bible_reading }}</p>
        </div>
        <div v-if="generatedPlan.discussion_questions" class="mb-3">
          <p class="font-medium text-gray-700 dark:text-gray-300">Discussion Questions:</p>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
            <li v-for="(q, i) in (Array.isArray(generatedPlan.discussion_questions) ? generatedPlan.discussion_questions : [])" :key="i">{{ q }}</li>
          </ul>
        </div>
        <div v-if="generatedPlan.activities" class="mb-3">
          <p class="font-medium text-gray-700 dark:text-gray-300">Activities:</p>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
            <li v-for="(a, i) in (Array.isArray(generatedPlan.activities) ? generatedPlan.activities : [])" :key="i">{{ a }}</li>
          </ul>
        </div>
        <div v-if="generatedPlan.notes" class="mb-3">
          <p class="font-medium text-gray-700 dark:text-gray-300">Notes:</p>
          <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">{{ generatedPlan.notes }}</p>
        </div>
        <button @click="saveGeneratedPlan" class="btn btn-primary mt-4">
          Save as Worship Plan
        </button>
      </div>
    </div>

    <!-- Activity Suggestions -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Get Activity Suggestions</h2>
      <form @submit.prevent="generateActivities" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
            <input v-model.number="activityForm.age" type="number" min="0" max="120" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme (optional)</label>
            <input v-model="activityForm.theme" type="text" class="input" />
          </div>
        </div>
        <button type="submit" :disabled="generating" class="btn btn-primary">
          {{ generating ? 'Generating...' : 'Get Suggestions' }}
        </button>
      </form>

      <div v-if="generatedActivities" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">{{ generatedActivities }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

const aiEnabled = ref(false);
const generating = ref(false);
const generatedPlan = ref(null);
const generatedActivities = ref(null);

const worshipForm = ref({
  age: null,
  theme: '',
  interests: ''
});

const activityForm = ref({
  age: null,
  theme: ''
});

onMounted(async () => {
  await checkAIStatus();
});

const checkAIStatus = async () => {
  try {
    const response = await api.get('/settings/ai_enabled');
    aiEnabled.value = response.data.value === 'true';
  } catch (error) {
    aiEnabled.value = false;
  }
};

const generateWorshipPlan = async () => {
  if (!aiEnabled.value) {
    alert('AI Assistant is not enabled. Please configure it in Settings.');
    return;
  }

  generating.value = true;
  generatedPlan.value = null;

  try {
    const response = await api.post('/ai/worship-plan', worshipForm.value);
    generatedPlan.value = response.data;
  } catch (error) {
    console.error('Failed to generate plan:', error);
    alert(error.response?.data?.error || 'Failed to generate worship plan');
  } finally {
    generating.value = false;
  }
};

const generateActivities = async () => {
  if (!aiEnabled.value) {
    alert('AI Assistant is not enabled. Please configure it in Settings.');
    return;
  }

  generating.value = true;
  generatedActivities.value = null;

  try {
    const response = await api.post('/ai/activities', activityForm.value);
    generatedActivities.value = response.data.activities;
  } catch (error) {
    console.error('Failed to generate activities:', error);
    alert(error.response?.data?.error || 'Failed to generate activities');
  } finally {
    generating.value = false;
  }
};

const saveGeneratedPlan = async () => {
  try {
    const planData = {
      title: generatedPlan.value.title || 'AI Generated Plan',
      bible_reading: generatedPlan.value.bible_reading || '',
      activities: Array.isArray(generatedPlan.value.activities) ? generatedPlan.value.activities : [],
      notes: generatedPlan.value.notes || JSON.stringify(generatedPlan.value, null, 2)
    };

    await api.post('/worship/plans', planData);
    alert('Worship plan saved successfully!');
    generatedPlan.value = null;
  } catch (error) {
    console.error('Failed to save plan:', error);
    alert('Failed to save worship plan');
  }
};
</script>
