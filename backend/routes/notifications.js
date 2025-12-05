import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true') {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await dbAll(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
      [req.user.id]
    );
    res.json({ count: count?.count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await dbGet('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await dbRun('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id]);
    const updated = await dbGet('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await dbRun('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await dbGet('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await dbRun('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await dbAll(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [req.user.id]
    );
    res.json(preferences);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preference
router.put('/preferences/:type', authenticateToken, [
  body('enabled').optional().isBoolean(),
  body('reminder_minutes').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { enabled, reminder_minutes } = req.body;
    const notificationType = req.params.type;

    // Check if preference exists
    const existing = await dbGet(
      'SELECT * FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
      [req.user.id, notificationType]
    );

    if (existing) {
      await dbRun(
        `UPDATE notification_preferences 
         SET enabled = COALESCE(?, enabled),
             reminder_minutes = COALESCE(?, reminder_minutes),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND notification_type = ?`,
        [enabled, reminder_minutes, req.user.id, notificationType]
      );
    } else {
      await dbRun(
        `INSERT INTO notification_preferences (user_id, notification_type, enabled, reminder_minutes)
         VALUES (?, ?, ?, ?)`,
        [req.user.id, notificationType, enabled !== undefined ? enabled : 1, reminder_minutes || 60]
      );
    }

    const updated = await dbGet(
      'SELECT * FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
      [req.user.id, notificationType]
    );
    res.json(updated);
  } catch (error) {
    console.error('Update notification preference error:', error);
    res.status(500).json({ error: 'Failed to update notification preference' });
  }
});

export default router;
