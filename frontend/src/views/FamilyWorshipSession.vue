<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Header with animation -->
      <div class="mb-6 sm:mb-8 animate-fade-in-down">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse-slow">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Family Worship Night
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {{ plan?.title || 'Loading...' }}
                </p>
              </div>
            </div>
            <div v-if="event" class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 ml-15">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatDate(event.start_date) }}</span>
            </div>
          </div>
          <button
            @click="exitSession"
            class="btn btn-secondary text-sm hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
          >
            Exit Session
          </button>
        </div>
      </div>

      <!-- Loading State with animation -->
      <div v-if="loading" class="card text-center py-16 animate-fade-in">
        <div class="inline-block relative">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-400 animate-pulse"></div>
          </div>
        </div>
        <p class="mt-4 text-gray-500 dark:text-gray-400 text-lg animate-pulse">Loading worship plan...</p>
      </div>

      <!-- Session Dashboard -->
      <div v-else-if="plan" class="space-y-6">
        <!-- Progress Indicator with animation -->
        <div class="card bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-in-up">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Session Progress</h2>
            </div>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400 animate-count-up">
              {{ completedSteps }} / {{ totalSteps }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              class="bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
              :style="{ width: `${progressPercentage}%` }"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {{ Math.round(progressPercentage) }}% Complete
          </p>
        </div>

        <!-- Bible Reading Section -->
        <div 
          v-if="plan.bible_reading" 
          class="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in-up"
          :style="{ animationDelay: '0.1s' }"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4 flex-1">
              <div class="flex-shrink-0 relative">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div v-if="sessionProgress.bibleReading" class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Bible Reading</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Read and discuss together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  v-model="sessionProgress.bibleReading"
                  @change="updateProgress"
                  class="w-7 h-7 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all duration-200 transform group-hover:scale-110"
                />
                <div v-if="sessionProgress.bibleReading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg class="w-5 h-5 text-white animate-check-in" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Complete</span>
            </label>
          </div>
          <div class="ml-18 mt-4 space-y-4">
            <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-500 animate-fade-in">
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ typeof plan.bible_reading === 'string' ? plan.bible_reading : (plan.bible_reading?.text || plan.bible_reading?.title || String(plan.bible_reading || '')) }}
              </p>
            </div>
            <div class="animate-fade-in" style="animation-delay: 0.2s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discussion Notes
              </label>
              <textarea
                v-model="sessionNotes.bibleReading"
                rows="3"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Jot down key points or questions that came up..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Songs Section -->
        <div 
          v-if="songLinks && songLinks.length > 0" 
          class="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in-up"
          :style="{ animationDelay: '0.2s' }"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4 flex-1">
              <div class="flex-shrink-0 relative">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div v-if="sessionProgress.songs" class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Songs</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Sing together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  v-model="sessionProgress.songs"
                  @change="updateProgress"
                  class="w-7 h-7 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all duration-200 transform group-hover:scale-110"
                />
                <div v-if="sessionProgress.songs" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg class="w-5 h-5 text-white animate-check-in" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Complete</span>
            </label>
          </div>
          <div class="ml-18 space-y-3">
            <div
              v-for="(song, index) in songLinks"
              :key="index"
              class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] animate-fade-in"
              :style="{ animationDelay: `${0.1 * index}s` }"
            >
              <a
                :href="song"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group font-medium"
              >
                <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span class="flex-1">Song {{ index + 1 }} - Open on JW.org</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Videos Section -->
        <div 
          v-if="videoLinks && videoLinks.length > 0" 
          class="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in-up"
          :style="{ animationDelay: '0.3s' }"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4 flex-1">
              <div class="flex-shrink-0 relative">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div v-if="sessionProgress.videos" class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Videos</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Watch and discuss</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  v-model="sessionProgress.videos"
                  @change="updateProgress"
                  class="w-7 h-7 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all duration-200 transform group-hover:scale-110"
                />
                <div v-if="sessionProgress.videos" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg class="w-5 h-5 text-white animate-check-in" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Complete</span>
            </label>
          </div>
          <div class="ml-18 space-y-3">
            <div
              v-for="(video, index) in videoLinks"
              :key="index"
              class="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] animate-fade-in"
              :style="{ animationDelay: `${0.1 * index}s` }"
            >
              <a
                :href="video"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group font-medium"
              >
                <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span class="flex-1">Video {{ index + 1 }} - Open on JW.org</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div class="mt-4 animate-fade-in" style="animation-delay: 0.2s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video Discussion Notes
              </label>
              <textarea
                v-model="sessionNotes.videos"
                rows="3"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="What did you learn? What questions came up?"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Activities Section -->
        <div 
          v-if="activities && activities.length > 0" 
          class="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in-up"
          :style="{ animationDelay: '0.4s' }"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4 flex-1">
              <div class="flex-shrink-0 relative">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div v-if="sessionProgress.activities" class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Activities</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Engage together</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  v-model="sessionProgress.activities"
                  @change="updateProgress"
                  class="w-7 h-7 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all duration-200 transform group-hover:scale-110"
                />
                <div v-if="sessionProgress.activities" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg class="w-5 h-5 text-white animate-check-in" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Complete</span>
            </label>
          </div>
          <div class="ml-18 space-y-3">
            <div
              v-for="(activity, index) in activities"
              :key="index"
              class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] animate-fade-in"
              :style="{ animationDelay: `${0.1 * index}s` }"
            >
              <div class="flex items-start">
                <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold mr-4 shadow-md transform hover:scale-110 transition-transform">
                  {{ index + 1 }}
                </span>
                <p class="text-gray-900 dark:text-white flex-1 leading-relaxed">{{ activity }}</p>
              </div>
            </div>
            <div class="mt-4 animate-fade-in" style="animation-delay: 0.2s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Notes
              </label>
              <textarea
                v-model="sessionNotes.activities"
                rows="3"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="How did the activities go? What did the family enjoy?"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Additional Notes Section -->
        <div v-if="plan.notes" class="card bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 shadow-lg animate-slide-in-up" style="animation-delay: 0.5s">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Additional Notes
          </h3>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ plan.notes }}</p>
        </div>

        <!-- Session Notes -->
        <div class="card bg-white dark:bg-gray-800 shadow-lg animate-slide-in-up" style="animation-delay: 0.6s">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Session Notes
          </h3>
          <div class="space-y-4">
            <div class="animate-fade-in" style="animation-delay: 0.7s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Participants
              </label>
              <input
                v-model="sessionNotes.participants"
                type="text"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Who participated in tonight's worship?"
              />
            </div>
            <div class="animate-fade-in" style="animation-delay: 0.8s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overall Reflections
              </label>
              <textarea
                v-model="sessionNotes.reflections"
                rows="4"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="How did the session go? What were the highlights?"
              ></textarea>
            </div>
            <div class="animate-fade-in" style="animation-delay: 0.9s">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thoughts for Future Sessions
              </label>
              <textarea
                v-model="sessionNotes.futureThoughts"
                rows="3"
                class="input transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ideas or topics for upcoming worship nights..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Complete Session Button -->
        <div class="sticky bottom-0 bg-gradient-to-r from-white via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border-t-2 border-primary-200 dark:border-primary-800 p-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-2xl animate-slide-in-up" style="animation-delay: 1s">
          <button
            @click="completeSession"
            class="w-full btn btn-primary text-lg py-4 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
            :disabled="completing"
          >
            <span v-if="completing" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Completing Session...
            </span>
            <span v-else class="flex items-center justify-center">
              <svg class="w-6 h-6 mr-2 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete Family Worship Session
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-1000"></div>
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="card text-center py-12 animate-fade-in">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400 mb-4 text-lg font-medium">Failed to load worship plan</p>
        <button @click="exitSession" class="btn btn-secondary hover:scale-105 transition-transform">Go Back</button>
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

<style scoped>
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes check-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.6s ease-out;
}

.animate-slide-in-up {
  animation: slide-in-up 0.6s ease-out forwards;
  opacity: 0;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
  opacity: 0;
}

.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}

.animate-check-in {
  animation: check-in 0.3s ease-out;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-count-up {
  animation: fade-in 0.5s ease-out;
}
</style>
