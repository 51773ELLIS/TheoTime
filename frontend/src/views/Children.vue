<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Children Profiles</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage children profiles and spiritual goals
        </p>
      </div>
    </div>

    <!-- Profiles -->
    <div v-if="authStore.isParent" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="card"
      >
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ profile.full_name || profile.username }}
        </h3>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p v-if="profile.age">Age: {{ profile.age }}</p>
          <p v-if="profile.interests">Interests: {{ profile.interests }}</p>
          <p v-if="profile.favorite_characters">Favorite Characters: {{ profile.favorite_characters }}</p>
        </div>
        <button
          @click="editProfile(profile)"
          class="mt-4 btn btn-secondary text-sm"
        >
          Edit Profile
        </button>
      </div>
    </div>

    <!-- Spiritual Goals -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Spiritual Goals</h2>
        <button @click="showGoalModal = true" class="btn btn-primary">
          + New Goal
        </button>
      </div>
      <div class="space-y-4">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ goal.title }}</h3>
                <span
                  v-if="goal.completed"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                >
                  Completed
                </span>
              </div>
              <p v-if="goal.description" class="text-gray-600 dark:text-gray-400 mb-2">{{ goal.description }}</p>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                <span v-if="goal.target_date">Target: {{ formatDate(goal.target_date) }}</span>
              </div>
              <div v-if="goal.progress_notes" class="mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress Notes:</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ goal.progress_notes }}</p>
              </div>
            </div>
            <div class="flex space-x-2 ml-4">
              <button
                v-if="!goal.completed"
                @click="markGoalComplete(goal.id)"
                class="btn btn-primary text-sm"
              >
                Complete
              </button>
              <button
                @click="editGoal(goal)"
                class="btn btn-secondary text-sm"
              >
                Edit
              </button>
              <button
                @click="deleteGoal(goal.id)"
                class="btn btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        <div v-if="goals.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          No spiritual goals yet
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <div v-if="showProfileModal && authStore.isParent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 class="text-2xl font-bold mb-4">Edit Profile</h2>
        <form @submit.prevent="saveProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
            <input v-model.number="profileForm.age" type="number" min="0" max="120" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interests</label>
            <textarea v-model="profileForm.interests" rows="3" class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favorite Bible Characters</label>
            <textarea v-model="profileForm.favorite_characters" rows="2" class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favorite Bible Stories</label>
            <textarea v-model="profileForm.favorite_stories" rows="2" class="input"></textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Save</button>
            <button type="button" @click="showProfileModal = false" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Goal Modal -->
    <div v-if="showGoalModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 class="text-2xl font-bold mb-4">{{ editingGoal ? 'Edit Goal' : 'New Spiritual Goal' }}</h2>
        <form @submit.prevent="saveGoal" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="goalForm.title" type="text" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea v-model="goalForm.description" rows="3" class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date</label>
            <input v-model="goalForm.target_date" type="date" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress Notes</label>
            <textarea v-model="goalForm.progress_notes" rows="3" class="input"></textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Save</button>
            <button type="button" @click="closeGoalModal" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';

const authStore = useAuthStore();
const profiles = ref([]);
const goals = ref([]);
const showProfileModal = ref(false);
const showGoalModal = ref(false);
const editingProfile = ref(null);
const editingGoal = ref(null);

const profileForm = ref({
  user_id: null,
  age: null,
  interests: '',
  favorite_characters: '',
  favorite_stories: ''
});

const goalForm = ref({
  user_id: null,
  title: '',
  description: '',
  target_date: '',
  progress_notes: ''
});

onMounted(async () => {
  await loadGoals();
  if (authStore.isParent) {
    await loadProfiles();
  }
});

const loadProfiles = async () => {
  try {
    const response = await api.get('/children/profiles');
    profiles.value = response.data;
  } catch (error) {
    console.error('Failed to load profiles:', error);
  }
};

const loadGoals = async () => {
  try {
    const response = await api.get('/children/goals');
    goals.value = response.data;
  } catch (error) {
    console.error('Failed to load goals:', error);
  }
};

const editProfile = (profile) => {
  editingProfile.value = profile;
  profileForm.value = {
    user_id: profile.user_id,
    age: profile.age || null,
    interests: profile.interests || '',
    favorite_characters: profile.favorite_characters || '',
    favorite_stories: profile.favorite_stories || ''
  };
  showProfileModal.value = true;
};

const saveProfile = async () => {
  try {
    await api.post('/children/profiles', profileForm.value);
    showProfileModal.value = false;
    await loadProfiles();
  } catch (error) {
    console.error('Failed to save profile:', error);
    alert('Failed to save profile');
  }
};

const saveGoal = async () => {
  try {
    const data = {
      ...goalForm.value,
      user_id: authStore.isParent ? (goalForm.value.user_id || authStore.user.id) : authStore.user.id,
      target_date: goalForm.value.target_date || null
    };

    if (editingGoal.value) {
      await api.put(`/children/goals/${editingGoal.value.id}`, data);
    } else {
      await api.post('/children/goals', data);
    }

    closeGoalModal();
    await loadGoals();
  } catch (error) {
    console.error('Failed to save goal:', error);
    alert('Failed to save goal');
  }
};

const editGoal = (goal) => {
  editingGoal.value = goal;
  goalForm.value = {
    user_id: goal.user_id,
    title: goal.title,
    description: goal.description || '',
    target_date: goal.target_date ? goal.target_date.substring(0, 10) : '',
    progress_notes: goal.progress_notes || ''
  };
  showGoalModal.value = true;
};

const markGoalComplete = async (id) => {
  try {
    await api.put(`/children/goals/${id}`, { completed: true });
    await loadGoals();
  } catch (error) {
    console.error('Failed to mark goal complete:', error);
  }
};

const deleteGoal = async (id) => {
  if (!confirm('Are you sure you want to delete this goal?')) return;
  try {
    await api.delete(`/children/goals/${id}`);
    await loadGoals();
  } catch (error) {
    console.error('Failed to delete goal:', error);
  }
};

const closeGoalModal = () => {
  showGoalModal.value = false;
  editingGoal.value = null;
  goalForm.value = {
    user_id: null,
    title: '',
    description: '',
    target_date: '',
    progress_notes: ''
  };
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>
