<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your worship nights, study sessions, and events
        </p>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          @click="showFilters = !showFilters"
          class="btn btn-secondary w-full sm:w-auto"
        >
          {{ showFilters ? 'Hide' : 'Show' }} Filters
        </button>
        <button
          @click="showEventModal = true"
          class="btn btn-primary w-full sm:w-auto"
        >
          + Add Event
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="showFilters" class="card">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
          <select v-model="eventTypeFilter" @change="applyFilters" class="input">
            <option value="">All Types</option>
            <option value="worship">Worship</option>
            <option value="personal_study">Personal Study</option>
            <option value="meeting">Meeting</option>
            <option value="ministry">Ministry</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select v-model="completionFilter" @change="applyFilters" class="input">
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="clearFilters" class="btn btn-secondary w-full">Clear Filters</button>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="card">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- Event Details Modal (for worship events) -->
    <div v-if="showEventDetailsModal" class="mobile-modal">
      <div class="mobile-modal-content max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">{{ selectedEvent?.title || 'Event Details' }}</h2>
        
        <div v-if="selectedEvent?.is_completed === 1 || selectedEvent?.has_completed_log" class="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
          <p class="text-green-800 dark:text-green-200 font-medium">✓ This worship night has been completed</p>
        </div>

        <div v-if="selectedEvent?.worship_plan_title" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Assigned Plan:</p>
          <p class="text-blue-800 dark:text-blue-200 font-medium">{{ selectedEvent.worship_plan_title }}</p>
        </div>

        <!-- Event Info -->
        <div class="mb-4 space-y-2">
          <div v-if="selectedEvent?.start_date">
            <p class="text-sm text-gray-600 dark:text-gray-400">Start:</p>
            <p class="text-gray-900 dark:text-white">{{ formatEventDate(selectedEvent.start_date) }}</p>
          </div>
          <div v-if="selectedEvent?.end_date">
            <p class="text-sm text-gray-600 dark:text-gray-400">End:</p>
            <p class="text-gray-900 dark:text-white">{{ formatEventDate(selectedEvent.end_date) }}</p>
          </div>
          <div v-if="selectedEvent?.description">
            <p class="text-sm text-gray-600 dark:text-gray-400">Description:</p>
            <p class="text-gray-900 dark:text-white">{{ selectedEvent.description }}</p>
          </div>
        </div>

        <!-- Action Buttons for Parents -->
        <div v-if="authStore.isParent || authStore.user?.role === 'parent'" class="mb-4 flex flex-col sm:flex-row gap-2 border-t pt-4">
          <button @click="editEventFromDetails" class="btn btn-primary flex-1">✏️ Edit Event</button>
          <button @click="deleteEventFromDetails" class="btn btn-danger flex-1">🗑️ Delete Event</button>
        </div>
        
        <!-- Show message for non-parent users -->
        <div v-else-if="authStore.user && authStore.user.role !== 'parent'" class="mb-4 border-t pt-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Only parents can edit or delete events.</p>
        </div>

        <div v-if="selectedEvent?.event_type === 'worship' && (authStore.isParent || authStore.user?.role === 'parent') && !selectedEvent?.is_completed && !selectedEvent?.has_completed_log" class="space-y-4 mt-4 border-t pt-4">
          <!-- Assign Plan Section -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Worship Plan</label>
            <select v-model="selectedPlanId" class="input">
              <option value="">-- Select a plan --</option>
              <option v-for="plan in availablePlans" :key="plan.id" :value="plan.id">
                {{ plan.title }}
              </option>
            </select>
            <button 
              @click="assignPlan" 
              :disabled="!selectedPlanId"
              class="btn btn-primary mt-2 w-full sm:w-auto"
            >
              Assign Plan
            </button>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-lg font-semibold mb-3">Complete Worship Night</h3>
            <form @submit.prevent="completeEvent" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What was covered *</label>
                <textarea v-model="reviewForm.what_was_covered" rows="4" required class="input" placeholder="Describe what was discussed during the worship session"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participants</label>
                <input v-model="reviewForm.participants" type="text" class="input" placeholder="Comma-separated names" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">How it went</label>
                <textarea v-model="reviewForm.reflections" rows="3" class="input" placeholder="Share your thoughts on how the session went"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thoughts for future worship nights</label>
                <textarea v-model="reviewForm.future_thoughts" rows="3" class="input" placeholder="Ideas or topics for upcoming sessions"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</label>
                <textarea v-model="reviewForm.notes" rows="2" class="input"></textarea>
              </div>
              <div class="flex space-x-3">
                <button type="submit" class="flex-1 btn btn-primary">Mark as Completed</button>
                <button type="button" @click="closeEventDetailsModal" class="flex-1 btn btn-secondary">Close</button>
              </div>
            </form>
          </div>
        </div>

        <div v-else class="flex justify-end">
          <button @click="closeEventDetailsModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="mobile-modal">
      <div class="mobile-modal-content">
        <h2 class="text-2xl font-bold mb-4">{{ editingEvent ? 'Edit Event' : 'New Event' }}</h2>
        <form @submit.prevent="saveEvent" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="eventForm.title" type="text" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select v-model="eventForm.event_type" required class="input">
              <option value="worship">Worship</option>
              <option value="personal_study">Personal Study</option>
              <option value="meeting">Meeting</option>
              <option value="ministry">Ministry</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date & Time</label>
            <input v-model="eventForm.start_date" type="datetime-local" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date & Time (optional)</label>
            <input v-model="eventForm.end_date" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea v-model="eventForm.description" rows="3" class="input"></textarea>
          </div>
          <div class="flex items-center">
            <input
              v-model="eventForm.is_recurring"
              type="checkbox"
              id="recurring"
              class="mr-2"
            />
            <label for="recurring" class="text-sm text-gray-700 dark:text-gray-300">Recurring event</label>
          </div>
          <div v-if="eventForm.is_recurring">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurrence Pattern</label>
            <select v-model="eventForm.recurrence_pattern" class="input">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div v-if="editingEvent && (authStore.isParent || authStore.user?.role === 'parent')" class="flex space-x-3 mb-3">
            <button type="button" @click="deleteEvent" class="flex-1 btn btn-danger">Delete Event</button>
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
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '@/utils/api';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

const showEventModal = ref(false);
const showEventDetailsModal = ref(false);
const showFilters = ref(false);
const eventTypeFilter = ref('');
const completionFilter = ref('all');
const editingEvent = ref(null);
const selectedEvent = ref(null);
const events = ref([]);
const allEvents = ref([]);
const availablePlans = ref([]);
const selectedPlanId = ref(null);
const reviewForm = ref({
  what_was_covered: '',
  participants: '',
  reflections: '',
  future_thoughts: '',
  notes: ''
});
const eventForm = ref({
  title: '',
  event_type: 'worship',
  start_date: '',
  end_date: '',
  description: '',
  is_recurring: false,
  recurrence_pattern: 'weekly'
});

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: [],
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventChange: handleEventChange
});

onMounted(async () => {
  // Ensure auth is initialized
  if (!authStore.user && authStore.token) {
    await authStore.init();
  }
  await loadEvents();
});

const loadEvents = async () => {
  try {
    const response = await api.get('/events');
    allEvents.value = response.data;
    applyFilters();
  } catch (error) {
    console.error('Failed to load events:', error);
  }
};

const applyFilters = () => {
  let filtered = [...allEvents.value];
  
  // Filter by event type
  if (eventTypeFilter.value) {
    filtered = filtered.filter(e => e.event_type === eventTypeFilter.value);
  }
  
  // Filter by completion status
  if (completionFilter.value === 'completed') {
    filtered = filtered.filter(e => e.is_completed === 1 || e.has_completed_log);
  } else if (completionFilter.value === 'pending') {
    filtered = filtered.filter(e => e.is_completed !== 1 && !e.has_completed_log);
  }
  
  events.value = filtered;
  
  // Map events for FullCalendar
  calendarOptions.value.events = events.value.map(event => {
      const isCompleted = event.is_completed === 1 || event.has_completed_log;
      const hasPlan = event.worship_plan_id;
      
      return {
        id: String(event.id), // FullCalendar expects string IDs
        title: event.title + (hasPlan ? ' 📋' : '') + (isCompleted ? ' ✓' : ''),
        start: event.start_date,
        end: event.end_date || null,
        backgroundColor: isCompleted ? '#10b981' : getEventColor(event.event_type),
        borderColor: isCompleted ? '#10b981' : getEventColor(event.event_type),
        extendedProps: {
          originalId: event.id, // Store original numeric ID for lookup
          event_type: event.event_type,
          description: event.description,
          is_recurring: event.is_recurring === 1,
          recurrence_pattern: event.recurrence_pattern,
          worship_plan_id: event.worship_plan_id,
          worship_plan_title: event.worship_plan_title,
          is_completed: isCompleted,
          has_completed_log: event.has_completed_log
        }
      };
    });
};

const clearFilters = () => {
  eventTypeFilter.value = '';
  completionFilter.value = 'all';
  applyFilters();
};

const getEventColor = (type) => {
  const colors = {
    worship: '#0ea5e9',
    personal_study: '#10b981',
    meeting: '#8b5cf6',
    ministry: '#f59e0b',
    other: '#6b7280'
  };
  return colors[type] || colors.other;
};

function handleDateSelect(selectInfo) {
  eventForm.value.start_date = selectInfo.startStr.replace('T', ' ').substring(0, 16);
  if (selectInfo.endStr) {
    eventForm.value.end_date = selectInfo.endStr.replace('T', ' ').substring(0, 16);
  }
  editingEvent.value = null;
  showEventModal.value = true;
}

async function handleEventClick(clickInfo) {
  // Prevent default behavior
  clickInfo.jsEvent.preventDefault();
  clickInfo.jsEvent.stopPropagation();
  
  // Ensure user is loaded
  if (!authStore.user) {
    await authStore.init();
  }
  
  // Debug: Log user role for troubleshooting
  console.log('User role check:', {
    user: authStore.user,
    role: authStore.user?.role,
    isParent: authStore.isParent,
    isParentComputed: authStore.user?.role === 'parent'
  });
  
  // Get the original numeric ID from extendedProps or parse the string ID
  const eventId = clickInfo.event.extendedProps?.originalId || parseInt(clickInfo.event.id);
  const event = events.value.find(e => e.id === eventId);
  
  if (!event) {
    console.error('Event not found:', {
      clickedId: clickInfo.event.id,
      parsedId: eventId,
      availableIds: events.value.map(e => e.id)
    });
    alert('Event not found. Please refresh the page.');
    return;
  }
  
  // If it's a worship event, show the details modal for plan assignment/completion
  if (event.event_type === 'worship') {
    selectedEvent.value = event;
    selectedPlanId.value = event.worship_plan_id || null;
    
    // Load available plans
    try {
      const plansResponse = await api.get('/worship/plans');
      availablePlans.value = plansResponse.data.filter(plan => !plan.is_completed && !plan.event_completed);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
    
    showEventDetailsModal.value = true;
  } else {
    // For other event types, show details modal with edit/delete options
    selectedEvent.value = event;
    showEventDetailsModal.value = true;
  }
}

function handleEventChange(changeInfo) {
  // Handle drag and drop updates
  // Get the original numeric ID from extendedProps (FullCalendar converts IDs to strings)
  const eventId = changeInfo.event.extendedProps?.originalId || parseInt(changeInfo.event.id);
  const event = events.value.find(e => e.id === eventId);
  if (event) {
    updateEvent(event.id, {
      start_date: changeInfo.event.startStr,
      end_date: changeInfo.event.endStr
    });
  }
}

const saveEvent = async () => {
  try {
    // Format datetime-local input to ISO string
    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return null;
      // If already in correct format (YYYY-MM-DDTHH:mm), add seconds
      if (dateTimeString.includes('T')) {
        return dateTimeString + ':00';
      }
      // If in old format (YYYY-MM-DD HH:mm), convert to ISO
      return dateTimeString.replace(' ', 'T') + ':00';
    };
    
    const data = {
      ...eventForm.value,
      start_date: formatDateTime(eventForm.value.start_date),
      end_date: formatDateTime(eventForm.value.end_date)
    };

    if (editingEvent.value) {
      await api.put(`/events/${editingEvent.value.id}`, data);
      alert('Event updated successfully');
    } else {
      await api.post('/events', data);
      alert('Event created successfully');
    }

    closeModal();
    await loadEvents();
  } catch (error) {
    console.error('Failed to save event:', error);
    alert(error.response?.data?.error || 'Failed to save event');
  }
};

const updateEvent = async (id, data) => {
  try {
    await api.put(`/events/${id}`, data);
    await loadEvents();
  } catch (error) {
    console.error('Failed to update event:', error);
  }
};

const assignPlan = async () => {
  if (!selectedPlanId.value || !selectedEvent.value) return;
  
  try {
    await api.put(`/events/${selectedEvent.value.id}/assign-plan`, {
      worship_plan_id: selectedPlanId.value
    });
    await loadEvents();
    alert('Worship plan assigned successfully!');
    // Refresh selected event
    const updatedEvent = events.value.find(e => e.id === selectedEvent.value.id);
    if (updatedEvent) {
      selectedEvent.value = updatedEvent;
    }
  } catch (error) {
    console.error('Failed to assign plan:', error);
    alert('Failed to assign worship plan');
  }
};

const completeEvent = async () => {
  if (!selectedEvent.value) return;
  
  try {
    await api.put(`/events/${selectedEvent.value.id}/complete`, {
      worship_plan_id: selectedEvent.value.worship_plan_id,
      ...reviewForm.value
    });
    await loadEvents();
    alert('Worship night marked as completed!');
    closeEventDetailsModal();
  } catch (error) {
    console.error('Failed to complete event:', error);
    alert(error.response?.data?.error || 'Failed to complete event');
  }
};

const closeEventDetailsModal = () => {
  showEventDetailsModal.value = false;
  selectedEvent.value = null;
  selectedPlanId.value = null;
  reviewForm.value = {
    what_was_covered: '',
    participants: '',
    reflections: '',
    future_thoughts: '',
    notes: ''
  };
};

const editEventFromDetails = () => {
  if (!selectedEvent.value) {
    console.error('No event selected');
    return;
  }
  
  // Close details modal and open edit modal
  closeEventDetailsModal();
  
  // Find the event in the events array
  const event = events.value.find(e => e.id === selectedEvent.value.id);
  if (!event) {
    console.error('Event not found in events array:', selectedEvent.value.id);
    alert('Event not found. Please refresh the page.');
    return;
  }
  
  editingEvent.value = event;
  
  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  eventForm.value = {
    title: event.title,
    event_type: event.event_type,
    start_date: formatForInput(event.start_date),
    end_date: event.end_date ? formatForInput(event.end_date) : '',
    description: event.description || '',
    is_recurring: event.is_recurring === 1,
    recurrence_pattern: event.recurrence_pattern || 'weekly'
  };
  
  showEventModal.value = true;
};

const deleteEventFromDetails = async () => {
  if (!selectedEvent.value) {
    console.error('No event selected for deletion');
    return;
  }
  
  const eventTitle = selectedEvent.value.title || 'this event';
  if (!confirm(`Are you sure you want to delete "${eventTitle}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/events/${selectedEvent.value.id}`);
    await loadEvents();
    alert('Event deleted successfully');
    closeEventDetailsModal();
  } catch (error) {
    console.error('Failed to delete event:', error);
    alert(error.response?.data?.error || 'Failed to delete event. Please try again.');
  }
};

const deleteEvent = async () => {
  if (!editingEvent.value) return;
  
  if (!confirm(`Are you sure you want to delete "${editingEvent.value.title}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/events/${editingEvent.value.id}`);
    await loadEvents();
    alert('Event deleted successfully');
    closeModal();
  } catch (error) {
    console.error('Failed to delete event:', error);
    alert('Failed to delete event');
  }
};

const formatEventDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const closeModal = () => {
  showEventModal.value = false;
  editingEvent.value = null;
  eventForm.value = {
    title: '',
    event_type: 'worship',
    start_date: '',
    end_date: '',
    description: '',
    is_recurring: false,
    recurrence_pattern: 'weekly'
  };
};
</script>
