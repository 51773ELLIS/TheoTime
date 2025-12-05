<template>
  <div class="relative">
    <div class="flex items-center">
      <input
        v-model="searchQuery"
        @keyup.enter="handleSearch"
        @focus="showSuggestions = true"
        type="text"
        placeholder="Search..."
        class="w-full sm:w-64 px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <svg
        class="absolute left-3 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const showSuggestions = ref(false);

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() }
    });
    searchQuery.value = '';
    showSuggestions.value = false;
  }
};
</script>
