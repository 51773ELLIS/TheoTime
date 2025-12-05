import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start, end, event_type } = req.query;
    let query = `SELECT e.*, 
      (SELECT wp.id FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_id,
      (SELECT wp.title FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_title,
      (SELECT COUNT(*) FROM worship_logs wl WHERE wl.event_id = e.id AND wl.is_completed = 1) as has_completed_log
      FROM events e WHERE 1=1`;
    const params = [];

    // Filter by user if not parent
    if (req.user.role !== 'parent') {
      query += ' AND (e.user_id = ? OR e.user_id IS NULL)';
      params.push(req.user.id);
    }

    if (start) {
      query += ' AND e.start_date >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND e.start_date <= ?';
      params.push(end);
    }

    if (event_type) {
      query += ' AND e.event_type = ?';
      params.push(event_type);
    }

    query += ' ORDER BY e.start_date ASC';

    const events = await dbAll(query, params);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await dbGet(`SELECT e.*, 
      (SELECT wp.id FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_id,
      (SELECT wp.title FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_title,
      (SELECT COUNT(*) FROM worship_logs wl WHERE wl.event_id = e.id AND wl.is_completed = 1) as has_completed_log
      FROM events e WHERE e.id = ?`, [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && event.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Helper function to generate recurring event instances
const generateRecurringInstances = (startDate, endDate, recurrencePattern, count = 52) => {
  const instances = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  for (let i = 0; i < count; i++) {
    const instanceStart = new Date(start);
    const instanceEnd = end ? new Date(end) : null;

    switch (recurrencePattern) {
      case 'weekly':
        instanceStart.setDate(start.getDate() + (i * 7));
        if (instanceEnd) instanceEnd.setDate(end.getDate() + (i * 7));
        break;
      case 'biweekly':
        instanceStart.setDate(start.getDate() + (i * 14));
        if (instanceEnd) instanceEnd.setDate(end.getDate() + (i * 14));
        break;
      case 'monthly':
        instanceStart.setMonth(start.getMonth() + i);
        if (instanceEnd) instanceEnd.setMonth(end.getMonth() + i);
        break;
      default:
        return instances; // Invalid pattern, return empty
    }

    instances.push({
      start: instanceStart.toISOString(),
      end: instanceEnd ? instanceEnd.toISOString() : null
    });
  }

  return instances;
};

// Create event
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('event_type').isIn(['worship', 'personal_study', 'meeting', 'ministry', 'other']).withMessage('Invalid event type'),
  body('start_date').notEmpty().withMessage('Start date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes, user_id } = req.body;

    // Set user_id - parents can assign to others, children can only create for themselves
    const assignedUserId = req.user.role === 'parent' ? (user_id || req.user.id) : req.user.id;

    // If recurring, generate instances (up to 1 year ahead)
    if (is_recurring && recurrence_pattern) {
      const instances = generateRecurringInstances(start_date, end_date, recurrence_pattern, 52);
      const createdEvents = [];

      for (const instance of instances) {
        const result = await dbRun(
          `INSERT INTO events (user_id, title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [assignedUserId, title, description || null, event_type, instance.start, instance.end, 1, recurrence_pattern, color || null, reminder_minutes || null]
        );
        const event = await dbGet('SELECT * FROM events WHERE id = ?', [result.lastID]);
        createdEvents.push(event);
      }

      return res.status(201).json({ 
        message: `Created ${createdEvents.length} recurring events`,
        events: createdEvents 
      });
    } else {
      // Single event
      const result = await dbRun(
        `INSERT INTO events (user_id, title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assignedUserId, title, description || null, event_type, start_date, end_date || null, is_recurring ? 1 : 0, recurrence_pattern || null, color || null, reminder_minutes || null]
      );

      const event = await dbGet('SELECT * FROM events WHERE id = ?', [result.lastID]);
      res.status(201).json(event);
    }
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('event_type').optional().isIn(['worship', 'personal_study', 'meeting', 'ministry', 'other']).withMessage('Invalid event type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && event.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes } = req.body;

    await dbRun(
      `UPDATE events SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        event_type = COALESCE(?, event_type),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        is_recurring = COALESCE(?, is_recurring),
        recurrence_pattern = COALESCE(?, recurrence_pattern),
        color = COALESCE(?, color),
        reminder_minutes = COALESCE(?, reminder_minutes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes, req.params.id]
    );

    const updatedEvent = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Assign worship plan to event
router.put('/:id/assign-plan', authenticateToken, [
  body('worship_plan_id').notEmpty().withMessage('Worship plan ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && event.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { worship_plan_id } = req.body;

    // Update the worship plan to link it to this event
    await dbRun('UPDATE worship_plans SET event_id = ? WHERE id = ?', [req.params.id, worship_plan_id]);

    const updatedEvent = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Assign plan error:', error);
    res.status(500).json({ error: 'Failed to assign worship plan' });
  }
});

// Mark event as completed with review
router.put('/:id/complete', authenticateToken, [
  body('what_was_covered').notEmpty().withMessage('What was covered is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && event.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { worship_plan_id, participants, what_was_covered, reflections, notes, future_thoughts } = req.body;

    // Get the worship plan ID from event if not provided
    const planId = worship_plan_id || (await dbGet('SELECT id FROM worship_plans WHERE event_id = ? LIMIT 1', [req.params.id]))?.id;

    // Create or update worship log
    const existingLog = await dbGet('SELECT id FROM worship_logs WHERE event_id = ?', [req.params.id]);
    
    if (existingLog) {
      await dbRun(
        `UPDATE worship_logs SET 
          worship_plan_id = COALESCE(?, worship_plan_id),
          participants = ?,
          what_was_covered = ?,
          reflections = ?,
          notes = ?,
          future_thoughts = ?,
          is_completed = 1
         WHERE id = ?`,
        [planId, participants || null, what_was_covered, reflections || null, notes || null, future_thoughts || null, existingLog.id]
      );
    } else {
      await dbRun(
        `INSERT INTO worship_logs (worship_plan_id, event_id, participants, what_was_covered, reflections, notes, future_thoughts, is_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [planId, req.params.id, participants || null, what_was_covered, reflections || null, notes || null, future_thoughts || null]
      );
    }

    // Mark event as completed
    await dbRun('UPDATE events SET is_completed = 1 WHERE id = ?', [req.params.id]);

    const updatedEvent = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Complete event error:', error);
    res.status(500).json({ error: 'Failed to complete event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && event.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await dbRun('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
