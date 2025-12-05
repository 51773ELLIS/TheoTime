import { ref } from 'vue';
import api from '@/utils/api';

const notificationPermission = ref(null);
let pollingInterval = null;

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermission.value = 'granted';
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermission.value = permission;
    return permission === 'granted';
  }

  notificationPermission.value = 'denied';
  return false;
};

/**
 * Show a browser notification
 */
export const showNotification = (title, options = {}) => {
  if (notificationPermission.value !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
};

/**
 * Start polling for new notifications and show browser notifications
 */
export const startNotificationPolling = () => {
  // Poll every 60 seconds
  pollingInterval = setInterval(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      const count = response.data.count || 0;

      if (count > 0 && notificationPermission.value === 'granted') {
        // Show a notification if there are unread notifications
        showNotification('You have new notifications', {
          body: `You have ${count} unread notification${count !== 1 ? 's' : ''}`,
          tag: 'theotime-notifications'
        });
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  }, 60000); // Check every minute

  // Return stop function
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
};

/**
 * Stop notification polling
 */
export const stopNotificationPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};
