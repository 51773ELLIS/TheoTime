<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your worship nights, study sessions, and events
        </p>
      </div>
      <button
        @click="showEventModal = true"
        class="btn btn-primary w-full sm:w-auto"
      >
        + Add Event
      </button>
    </div>

    <!-- Calendar -->
    <div class="card">
      <FullCalendar :options="calendarOptions" />
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

const showEventModal = ref(false);
const editingEvent = ref(null);
const events = ref([]);
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
  await loadEvents();
});

const loadEvents = async () => {
  try {
    const response = await api.get('/events');
    events.value = response.data;
    calendarOptions.value.events = events.value.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      backgroundColor: getEventColor(event.event_type),
      borderColor: getEventColor(event.event_type)
    }));
  } catch (error) {
    console.error('Failed to load events:', error);
  }
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

function handleEventClick(clickInfo) {
  editingEvent.value = events.value.find(e => e.id === clickInfo.event.id);
  eventForm.value = {
    title: editingEvent.value.title,
    event_type: editingEvent.value.event_type,
    start_date: editingEvent.value.start_date.replace('T', ' ').substring(0, 16),
    end_date: editingEvent.value.end_date ? editingEvent.value.end_date.replace('T', ' ').substring(0, 16) : '',
    description: editingEvent.value.description || '',
    is_recurring: editingEvent.value.is_recurring === 1,
    recurrence_pattern: editingEvent.value.recurrence_pattern || 'weekly'
  };
  showEventModal.value = true;
}

function handleEventChange(changeInfo) {
  // Handle drag and drop updates
  const event = events.value.find(e => e.id === changeInfo.event.id);
  if (event) {
    updateEvent(event.id, {
      start_date: changeInfo.event.startStr,
      end_date: changeInfo.event.endStr
    });
  }
}

const saveEvent = async () => {
  try {
    const data = {
      ...eventForm.value,
      start_date: eventForm.value.start_date.replace(' ', 'T') + ':00',
      end_date: eventForm.value.end_date ? eventForm.value.end_date.replace(' ', 'T') + ':00' : null
    };

    if (editingEvent.value) {
      await api.put(`/events/${editingEvent.value.id}`, data);
    } else {
      await api.post('/events', data);
    }

    closeModal();
    await loadEvents();
  } catch (error) {
    console.error('Failed to save event:', error);
    alert('Failed to save event');
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
