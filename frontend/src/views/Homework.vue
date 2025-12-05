<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Homework</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Assign and track spiritual homework
        </p>
      </div>
      <button
        @click="showModal = true"
        class="btn btn-primary w-full sm:w-auto"
      >
        + Assign Homework
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
          @click="filter = 'pending'"
          :class="filter === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'"
        >
          Pending
        </button>
        <button
          @click="filter = 'completed'"
          :class="filter === 'completed' ? 'btn btn-primary' : 'btn btn-secondary'"
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Homework List -->
    <div class="space-y-4">
      <div
        v-for="hw in filteredHomework"
        :key="hw.id"
        class="card"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ hw.title }}</h3>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="hw.completed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'"
              >
                {{ hw.completed ? 'Completed' : 'Pending' }}
              </span>
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {{ hw.task_type }}
              </span>
            </div>
            <p v-if="hw.description" class="text-gray-600 dark:text-gray-400 mb-2">{{ hw.description }}</p>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <span>Assigned to: {{ hw.assigned_to_username }}</span>
              <span v-if="hw.assigned_by_username" class="ml-4">Assigned by: {{ hw.assigned_by_username }}</span>
              <span v-if="hw.due_date" class="ml-4">Due: {{ formatDate(hw.due_date) }}</span>
            </div>
            <div v-if="hw.review_notes" class="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Review Notes:</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ hw.review_notes }}</p>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button
              v-if="!hw.completed"
              @click="markComplete(hw.id)"
              class="btn btn-primary text-sm"
            >
              Mark Complete
            </button>
            <button
              @click="editHomework(hw)"
              class="btn btn-secondary text-sm"
            >
              Edit
            </button>
            <button
              @click="deleteHomework(hw.id)"
              class="btn btn-danger text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <div v-if="filteredHomework.length === 0" class="card text-center py-8 text-gray-500 dark:text-gray-400">
        No homework found
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="mobile-modal">
      <div class="mobile-modal-content">
        <h2 class="text-2xl font-bold mb-4">{{ editingHomework ? 'Edit Homework' : 'Assign Homework' }}</h2>
        <form @submit.prevent="saveHomework" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="homeworkForm.title" type="text" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea v-model="homeworkForm.description" rows="3" class="input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Type</label>
            <select v-model="homeworkForm.task_type" required class="input">
              <option value="reading">Reading</option>
              <option value="watching">Watching</option>
              <option value="writing">Writing</option>
              <option value="memory_verse">Memory Verse</option>
              <option value="activity">Activity</option>
            </select>
          </div>
          <div v-if="authStore.isParent">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
            <select v-model="homeworkForm.assigned_to" required class="input">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.full_name || user.username }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input v-model="homeworkForm.due_date" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review Notes</label>
            <textarea v-model="homeworkForm.review_notes" rows="3" class="input"></textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="flex-1 btn btn-primary">Save</button>
            <button type="button" @click="closeModal" class="flex-1 btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';

const authStore = useAuthStore();
const homework = ref([]);
const users = ref([]);
const showModal = ref(false);
const editingHomework = ref(null);
const filter = ref('all');

const homeworkForm = ref({
  assigned_to: null,
  title: '',
  description: '',
  task_type: 'reading',
  due_date: '',
  review_notes: ''
});

const filteredHomework = computed(() => {
  if (filter.value === 'all') return homework.value;
  if (filter.value === 'pending') return homework.value.filter(hw => !hw.completed);
  if (filter.value === 'completed') return homework.value.filter(hw => hw.completed);
  return homework.value;
});

onMounted(async () => {
  await loadHomework();
  if (authStore.isParent) {
    await loadUsers();
  } else {
    homeworkForm.value.assigned_to = authStore.user.id;
  }
});

const loadHomework = async () => {
  try {
    const response = await api.get('/homework');
    homework.value = response.data;
  } catch (error) {
    console.error('Failed to load homework:', error);
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

const saveHomework = async () => {
  try {
    const data = {
      ...homeworkForm.value,
      due_date: homeworkForm.value.due_date ? new Date(homeworkForm.value.due_date).toISOString() : null
    };

    if (editingHomework.value) {
      await api.put(`/homework/${editingHomework.value.id}`, data);
    } else {
      await api.post('/homework', data);
    }

    closeModal();
    await loadHomework();
  } catch (error) {
    console.error('Failed to save homework:', error);
    alert('Failed to save homework');
  }
};

const editHomework = (hw) => {
  editingHomework.value = hw;
  homeworkForm.value = {
    assigned_to: hw.assigned_to,
    title: hw.title,
    description: hw.description || '',
    task_type: hw.task_type,
    due_date: hw.due_date ? hw.due_date.substring(0, 16) : '',
    review_notes: hw.review_notes || ''
  };
  showModal.value = true;
};

const markComplete = async (id) => {
  try {
    await api.put(`/homework/${id}`, { completed: true });
    await loadHomework();
  } catch (error) {
    console.error('Failed to mark complete:', error);
  }
};

const deleteHomework = async (id) => {
  if (!confirm('Are you sure you want to delete this homework?')) return;
  try {
    await api.delete(`/homework/${id}`);
    await loadHomework();
  } catch (error) {
    console.error('Failed to delete homework:', error);
  }
};

const closeModal = () => {
  showModal.value = false;
  editingHomework.value = null;
  homeworkForm.value = {
    assigned_to: authStore.isParent ? null : authStore.user.id,
    title: '',
    description: '',
    task_type: 'reading',
    due_date: '',
    review_notes: ''
  };
};

const formatDate = (dateString) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
</script>
