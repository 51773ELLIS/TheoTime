<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Configure your TheoTime preferences
      </p>
    </div>

    <!-- General Settings -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">General Settings</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
          <select v-model="settings.theme" @change="updateSetting('theme', settings.theme)" class="input">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Worship Night</label>
          <select v-model="settings.worship_night" @change="updateSetting('worship_night', settings.worship_night)" class="input">
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Feature Toggles -->
    <div v-if="authStore.isParent" class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Feature Toggles</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Homework Module</label>
            <p class="text-xs text-gray-500 dark:text-gray-400">Enable homework assignments</p>
          </div>
          <input
            v-model="settings.homework_enabled"
            @change="updateSetting('homework_enabled', settings.homework_enabled)"
            type="checkbox"
            class="w-4 h-4"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Assistant</label>
            <p class="text-xs text-gray-500 dark:text-gray-400">Enable AI-powered suggestions</p>
          </div>
          <input
            v-model="settings.ai_enabled"
            @change="updateSetting('ai_enabled', settings.ai_enabled)"
            type="checkbox"
            class="w-4 h-4"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Child AI Mode</label>
            <p class="text-xs text-gray-500 dark:text-gray-400">Allow children to use AI (limited)</p>
          </div>
          <input
            v-model="settings.child_ai_enabled"
            @change="updateSetting('child_ai_enabled', settings.child_ai_enabled)"
            type="checkbox"
            class="w-4 h-4"
          />
        </div>
      </div>
    </div>

    <!-- AI Configuration -->
    <div v-if="authStore.isParent" class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Configuration</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenAI API Key</label>
          <input
            v-model="settings.openai_api_key"
            @blur="updateSetting('openai_api_key', settings.openai_api_key)"
            type="password"
            class="input"
            placeholder="sk-..."
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your API key is stored locally and never shared
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenAI Model</label>
          <select v-model="settings.openai_model" @change="updateSetting('openai_model', settings.openai_model)" class="input">
            <optgroup label="GPT-3.5 Models">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </optgroup>
            <optgroup label="GPT-4 Models">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4o">GPT-4o</option>
            </optgroup>
            <optgroup label="Mini Models (Cost-Effective)">
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-3.5-turbo-0125">GPT-3.5 Turbo (Latest)</option>
            </optgroup>
          </select>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mini models offer similar quality at lower cost
          </p>
        </div>
      </div>
    </div>

    <!-- User Management -->
    <div v-if="authStore.isParent" class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">User Management</h2>
      <div class="space-y-4">
        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ user.full_name || user.username }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.role }} • {{ user.email || 'No email' }}</p>
          </div>
          <button
            @click="deleteUser(user.id)"
            class="btn btn-danger text-sm"
          >
            Delete
          </button>
        </div>
        <button @click="showAddUserModal = true" class="btn btn-primary">
          + Add User
        </button>
      </div>
    </div>

    <!-- Data Management -->
    <div v-if="authStore.isParent" class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Data Management</h2>
      <div class="space-y-4">
        <div>
          <button @click="exportData" class="btn btn-primary">
            Export Data
          </button>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Download all your data as JSON
          </p>
        </div>
        <div>
          <input
            ref="importFileInput"
            type="file"
            accept=".json"
            @change="importData"
            class="hidden"
          />
          <button @click="() => importFileInput?.click()" class="btn btn-secondary">
            Import Data
          </button>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Import data from a JSON file
          </p>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 class="text-2xl font-bold mb-4">Add New User</h2>
        <form @submit.prevent="addUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input v-model="newUser.username" type="text" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input v-model="newUser.password" type="password" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select v-model="newUser.role" class="input">
              <option value="child">Child</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (optional)</label>
            <input v-model="newUser.email" type="email" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name (optional)</label>
            <input v-model="newUser.full_name" type="text" class="input" />
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Add User</button>
            <button type="button" @click="showAddUserModal = false" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';

const authStore = useAuthStore();
const settings = ref({
  theme: 'light',
  worship_night: 'sunday',
  homework_enabled: true,
  ai_enabled: false,
  child_ai_enabled: false,
  openai_api_key: '',
  openai_model: 'gpt-3.5-turbo'
});
const users = ref([]);
const showAddUserModal = ref(false);
const importFileInput = ref(null);
const newUser = ref({
  username: '',
  password: '',
  role: 'child',
  email: '',
  full_name: ''
});

onMounted(async () => {
  await loadSettings();
  if (authStore.isParent) {
    await loadUsers();
  }
  applyTheme();
});

const loadSettings = async () => {
  try {
    const response = await api.get('/settings');
    settings.value = { ...settings.value, ...response.data };
    applyTheme();
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

const loadUsers = async () => {
  try {
    const response = await api.get('/users');
    users.value = response.data;
  } catch (error) {
    console.error('Failed to load users:', error);
  }
};

const updateSetting = async (key, value) => {
  try {
    await api.put(`/settings/${key}`, { value: value.toString() });
    if (key === 'theme') {
      applyTheme();
    }
  } catch (error) {
    console.error('Failed to update setting:', error);
    alert('Failed to update setting');
  }
};

const applyTheme = () => {
  const theme = settings.value.theme || 'light';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const addUser = async () => {
  try {
    await api.post('/auth/register', newUser.value);
    showAddUserModal.value = false;
    newUser.value = {
      username: '',
      password: '',
      role: 'child',
      email: '',
      full_name: ''
    };
    await loadUsers();
    alert('User added successfully');
  } catch (error) {
    console.error('Failed to add user:', error);
    alert(error.response?.data?.error || 'Failed to add user');
  }
};

const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    await api.delete(`/users/${id}`);
    await loadUsers();
  } catch (error) {
    console.error('Failed to delete user:', error);
    alert('Failed to delete user');
  }
};

const exportData = async () => {
  try {
    const response = await api.get('/settings/export/data', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `theotime-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to export data:', error);
    alert('Failed to export data');
  }
};

const importData = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await api.post('/settings/import/data', { data });
    alert('Data imported successfully');
    location.reload();
  } catch (error) {
    console.error('Failed to import data:', error);
    alert('Failed to import data');
  }
};
</script>
