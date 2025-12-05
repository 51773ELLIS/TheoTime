import { dbGet, dbAll, dbRun } from './database.js';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    // Check if user has this notification type enabled
    const preference = await dbGet(
      'SELECT enabled FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
      [userId, type]
    );

    // If preference exists and is disabled, don't create notification
    if (preference && preference.enabled === 0) {
      return null;
    }

    const result = await dbRun(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId, relatedType]
    );

    return result.lastID;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

/**
 * Check for upcoming events and create reminder notifications
 */
export const checkEventReminders = async () => {
  try {
    // Get events that need reminders (within reminder window)
    const events = await dbAll(
      `SELECT e.*, u.id as user_id, u.username
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.is_completed = 0
         AND e.start_date > datetime('now')
         AND e.start_date <= datetime('now', '+' || COALESCE(e.reminder_minutes, 60) || ' minutes')
         AND e.reminder_minutes IS NOT NULL
         AND u.id IS NOT NULL`
    );

    for (const event of events) {
      // Check if notification already exists for this event
      const existing = await dbGet(
        `SELECT id FROM notifications 
         WHERE user_id = ? 
           AND type = 'event_reminder' 
           AND related_id = ? 
           AND related_type = 'event'
           AND read = 0`,
        [event.user_id, event.id]
      );

      if (!existing) {
        const minutesUntil = Math.round((new Date(event.start_date) - new Date()) / 60000);
        await createNotification(
          event.user_id,
          'event_reminder',
          `Upcoming Event: ${event.title}`,
          `Your event "${event.title}" is starting in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}.`,
          event.id,
          'event'
        );
      }
    }

    return events.length;
  } catch (error) {
    console.error('Check event reminders error:', error);
    return 0;
  }
};

/**
 * Check for overdue homework and create notifications
 */
export const checkHomeworkOverdue = async () => {
  try {
    const overdueHomework = await dbAll(
      `SELECT h.*, u.id as user_id, u.username
       FROM homework h
       LEFT JOIN users u ON h.assigned_to = u.id
       WHERE h.completed = 0
         AND h.due_date < date('now')
         AND u.id IS NOT NULL`
    );

    for (const homework of overdueHomework) {
      // Check if notification already exists for this homework
      const existing = await dbGet(
        `SELECT id FROM notifications 
         WHERE user_id = ? 
           AND type = 'homework_overdue' 
           AND related_id = ? 
           AND related_type = 'homework'
           AND read = 0
           AND created_at > date('now', '-1 day')`,
        [homework.assigned_to, homework.id]
      );

      if (!existing) {
        await createNotification(
          homework.assigned_to,
          'homework_overdue',
          `Overdue Homework: ${homework.title}`,
          `Your homework "${homework.title}" was due on ${homework.due_date}.`,
          homework.id,
          'homework'
        );
      }
    }

    return overdueHomework.length;
  } catch (error) {
    console.error('Check homework overdue error:', error);
    return 0;
  }
};

/**
 * Run all notification checks
 */
export const runNotificationChecks = async () => {
  try {
    console.log('Running notification checks...');
    const eventReminders = await checkEventReminders();
    const overdueHomework = await checkHomeworkOverdue();
    console.log(`Notification checks complete: ${eventReminders} event reminders, ${overdueHomework} overdue homework notifications`);
    return {
      event_reminders: eventReminders,
      overdue_homework: overdueHomework
    };
  } catch (error) {
    console.error('Run notification checks error:', error);
    return {
      event_reminders: 0,
      overdue_homework: 0
    };
  }
};
