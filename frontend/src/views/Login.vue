<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h1 class="text-center text-4xl font-bold text-primary-600 dark:text-primary-400">TheoTime</h1>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Family Worship Planner
        </p>
      </div>
      <div class="card">
        <h2 class="text-2xl font-bold text-center mb-6">Sign in to your account</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {{ error }}
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="input"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn btn-primary"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div v-if="authStore.isParent === null" class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
          </p>
          <button
            @click="showRegister = true"
            class="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Register as Parent
          </button>
        </div>

        <!-- Register form -->
        <div v-if="showRegister" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-4">Register New Account</h3>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label for="reg-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="reg-username"
                v-model="registerData.username"
                type="text"
                required
                class="input"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label for="reg-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="reg-password"
                v-model="registerData.password"
                type="password"
                required
                class="input"
                placeholder="Choose a password (min 6 characters)"
              />
            </div>

            <div>
              <label for="reg-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (optional)
              </label>
              <input
                id="reg-email"
                v-model="registerData.email"
                type="email"
                class="input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label for="reg-fullname" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name (optional)
              </label>
              <input
                id="reg-fullname"
                v-model="registerData.full_name"
                type="text"
                class="input"
                placeholder="Your full name"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full btn btn-primary"
            >
              {{ loading ? 'Registering...' : 'Register' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showRegister = ref(false);
const registerData = ref({
  username: '',
  password: '',
  email: '',
  full_name: '',
  role: 'parent'
});

onMounted(async () => {
  await authStore.init();
  if (authStore.isAuthenticated) {
    router.push('/');
  }
});

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  const result = await authStore.login(username.value, password.value);
  
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
};

const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  const result = await authStore.register(registerData.value);
  
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
};
</script>
