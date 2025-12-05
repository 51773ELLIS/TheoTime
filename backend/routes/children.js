import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all children profiles
router.get('/profiles', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const profiles = await dbAll(`
      SELECT cp.*, u.username, u.full_name, u.email, u.role
      FROM children_profiles cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
    `);
    res.json(profiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Get child profile by user ID
router.get('/profiles/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Check permissions
    if (req.user.role !== 'parent' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const profile = await dbGet(`
      SELECT cp.*, u.username, u.full_name, u.email, u.role
      FROM children_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update child profile
router.post('/profiles', authenticateToken, requireRole('parent'), [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Invalid age')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, age, interests, favorite_characters, favorite_stories } = req.body;

    // Check if profile exists
    const existing = await dbGet('SELECT id FROM children_profiles WHERE user_id = ?', [user_id]);

    let result;
    if (existing) {
      await dbRun(
        `UPDATE children_profiles SET
          age = COALESCE(?, age),
          interests = COALESCE(?, interests),
          favorite_characters = COALESCE(?, favorite_characters),
          favorite_stories = COALESCE(?, favorite_stories),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [age, interests, favorite_characters, favorite_stories, user_id]
      );
      result = { lastID: existing.id };
    } else {
      result = await dbRun(
        `INSERT INTO children_profiles (user_id, age, interests, favorite_characters, favorite_stories)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, age || null, interests || null, favorite_characters || null, favorite_stories || null]
      );
    }

    const profile = await dbGet('SELECT * FROM children_profiles WHERE user_id = ?', [user_id]);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Create/update profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Spiritual goals
router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM spiritual_goals WHERE 1=1';
    const params = [];

    if (req.user.role !== 'parent') {
      query += ' AND user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY target_date ASC, created_at DESC';

    const goals = await dbAll(query, params);
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/goals', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, title, description, target_date } = req.body;

    // Set user_id - parents can assign to others, children can only create for themselves
    const assignedUserId = req.user.role === 'parent' ? (user_id || req.user.id) : req.user.id;

    const result = await dbRun(
      `INSERT INTO spiritual_goals (user_id, title, description, target_date)
       VALUES (?, ?, ?, ?)`,
      [assignedUserId, title, description || null, target_date || null]
    );

    const goal = await dbGet('SELECT * FROM spiritual_goals WHERE id = ?', [result.lastID]);
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await dbGet('SELECT * FROM spiritual_goals WHERE id = ?', [req.params.id]);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { title, description, target_date, completed, progress_notes } = req.body;

    await dbRun(
      `UPDATE spiritual_goals SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        target_date = COALESCE(?, target_date),
        completed = COALESCE(?, completed),
        completed_at = CASE WHEN ? = 1 AND completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        progress_notes = COALESCE(?, progress_notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, target_date, completed, completed, progress_notes, req.params.id]
    );

    const updatedGoal = await dbGet('SELECT * FROM spiritual_goals WHERE id = ?', [req.params.id]);
    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await dbGet('SELECT * FROM spiritual_goals WHERE id = ?', [req.params.id]);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await dbRun('DELETE FROM spiritual_goals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
