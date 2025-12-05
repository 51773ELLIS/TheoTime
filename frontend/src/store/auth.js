import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);
  const isParent = computed(() => user.value?.role === 'parent');

  // Initialize auth state
  const init = async () => {
    if (token.value) {
      try {
        const response = await api.get('/auth/verify');
        user.value = response.data.user;
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      } catch (error) {
        logout();
      }
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  // Logout
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Update user
  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData };
  };

  return {
    user,
    token,
    isAuthenticated,
    isParent,
    init,
    login,
    register,
    logout,
    updateUser
  };
});
