import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all homework
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { assigned_to, completed, due_before } = req.query;
    let query = 'SELECT h.*, u1.username as assigned_to_username, u2.username as assigned_by_username FROM homework h LEFT JOIN users u1 ON h.assigned_to = u1.id LEFT JOIN users u2 ON h.assigned_by = u2.id WHERE 1=1';
    const params = [];

    // Filter by assigned user if not parent
    if (req.user.role !== 'parent') {
      query += ' AND h.assigned_to = ?';
      params.push(req.user.id);
    } else if (assigned_to) {
      query += ' AND h.assigned_to = ?';
      params.push(assigned_to);
    }

    if (completed !== undefined) {
      query += ' AND h.completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }

    if (due_before) {
      query += ' AND h.due_date <= ?';
      params.push(due_before);
    }

    query += ' ORDER BY h.due_date ASC, h.created_at DESC';

    const homework = await dbAll(query, params);
    res.json(homework);
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

// Get homework by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const homework = await dbGet('SELECT h.*, u1.username as assigned_to_username, u2.username as assigned_by_username FROM homework h LEFT JOIN users u1 ON h.assigned_to = u1.id LEFT JOIN users u2 ON h.assigned_by = u2.id WHERE h.id = ?', [req.params.id]);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && homework.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(homework);
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

// Create homework (parent only, or child if enabled in settings)
router.post('/', authenticateToken, [
  body('assigned_to').notEmpty().withMessage('Assigned to is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('task_type').isIn(['reading', 'watching', 'writing', 'memory_verse', 'activity']).withMessage('Invalid task type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if homework is enabled
    const homeworkEnabled = await dbGet("SELECT value FROM settings WHERE key = 'homework_enabled'");
    if (homeworkEnabled && homeworkEnabled.value === 'false' && req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Homework feature is disabled' });
    }

    const { assigned_to, title, description, task_type, due_date } = req.body;

    // Only parents can assign to others
    if (req.user.role !== 'parent' && assigned_to != req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await dbRun(
      `INSERT INTO homework (assigned_to, assigned_by, title, description, task_type, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [assigned_to, req.user.id, title, description || null, task_type, due_date || null]
    );

    const homework = await dbGet('SELECT * FROM homework WHERE id = ?', [result.lastID]);
    res.status(201).json(homework);
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

// Update homework
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const homework = await dbGet('SELECT * FROM homework WHERE id = ?', [req.params.id]);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && homework.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { title, description, task_type, due_date, completed, review_notes } = req.body;

    await dbRun(
      `UPDATE homework SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        task_type = COALESCE(?, task_type),
        due_date = COALESCE(?, due_date),
        completed = COALESCE(?, completed),
        completed_at = CASE WHEN ? = 1 AND completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        review_notes = COALESCE(?, review_notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, task_type, due_date, completed, completed, review_notes, req.params.id]
    );

    const updatedHomework = await dbGet('SELECT * FROM homework WHERE id = ?', [req.params.id]);
    res.json(updatedHomework);
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
});

// Delete homework
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const homework = await dbGet('SELECT * FROM homework WHERE id = ?', [req.params.id]);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && homework.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await dbRun('DELETE FROM homework WHERE id = ?', [req.params.id]);
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
});

export default router;
