import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start, end, event_type } = req.query;
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    // Filter by user if not parent
    if (req.user.role !== 'parent') {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(req.user.id);
    }

    if (start) {
      query += ' AND start_date >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND start_date <= ?';
      params.push(end);
    }

    if (event_type) {
      query += ' AND event_type = ?';
      params.push(event_type);
    }

    query += ' ORDER BY start_date ASC';

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
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
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

    const result = await dbRun(
      `INSERT INTO events (user_id, title, description, event_type, start_date, end_date, is_recurring, recurrence_pattern, color, reminder_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [assignedUserId, title, description || null, event_type, start_date, end_date || null, is_recurring ? 1 : 0, recurrence_pattern || null, color || null, reminder_minutes || null]
    );

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [result.lastID]);
    res.status(201).json(event);
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
