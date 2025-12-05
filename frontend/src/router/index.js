import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('@/views/Calendar.vue')
      },
      {
        path: 'worship',
        name: 'Worship',
        component: () => import('@/views/Worship.vue')
      },
      {
        path: 'homework',
        name: 'Homework',
        component: () => import('@/views/Homework.vue')
      },
      {
        path: 'children',
        name: 'Children',
        component: () => import('@/views/Children.vue')
      },
      {
        path: 'ai',
        name: 'AI Assistant',
        component: () => import('@/views/AIAssistant.vue'),
        meta: { requiresParent: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue')
      },
      {
        path: 'search',
        name: 'SearchResults',
        component: () => import('@/views/SearchResults.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { requiresParent: true }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue')
      },
      {
        path: 'worship/session',
        name: 'FamilyWorshipSession',
        component: () => import('@/views/FamilyWorshipSession.vue'),
        meta: { requiresParent: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresParent && authStore.user?.role !== 'parent') {
    next('/');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
