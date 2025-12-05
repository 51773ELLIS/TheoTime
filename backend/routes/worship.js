import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';

const router = express.Router();

// Get all worship plans
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const { event_id } = req.query;
    let query = 'SELECT wp.*, e.title as event_title, e.start_date FROM worship_plans wp LEFT JOIN events e ON wp.event_id = e.id WHERE 1=1';
    const params = [];

    if (event_id) {
      query += ' AND wp.event_id = ?';
      params.push(event_id);
    }

    query += ' ORDER BY wp.created_at DESC';

    const plans = await dbAll(query, params);
    res.json(plans);
  } catch (error) {
    console.error('Get worship plans error:', error);
    res.status(500).json({ error: 'Failed to fetch worship plans' });
  }
});

// Get worship plan by ID
router.get('/plans/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await dbGet('SELECT wp.*, e.title as event_title, e.start_date FROM worship_plans wp LEFT JOIN events e ON wp.event_id = e.id WHERE wp.id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Worship plan not found' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Get worship plan error:', error);
    res.status(500).json({ error: 'Failed to fetch worship plan' });
  }
});

// Create worship plan
router.post('/plans', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_id, title, bible_reading, video_links, song_links, activities, notes } = req.body;

    const result = await dbRun(
      `INSERT INTO worship_plans (event_id, title, bible_reading, video_links, song_links, activities, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id || null,
        title,
        bible_reading || null,
        video_links ? JSON.stringify(video_links) : null,
        song_links ? JSON.stringify(song_links) : null,
        activities ? JSON.stringify(activities) : null,
        notes || null
      ]
    );

    const plan = await dbGet('SELECT * FROM worship_plans WHERE id = ?', [result.lastID]);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Create worship plan error:', error);
    res.status(500).json({ error: 'Failed to create worship plan' });
  }
});

// Update worship plan
router.put('/plans/:id', authenticateToken, async (req, res) => {
  try {
    const { title, bible_reading, video_links, song_links, activities, notes } = req.body;

    await dbRun(
      `UPDATE worship_plans SET
        title = COALESCE(?, title),
        bible_reading = COALESCE(?, bible_reading),
        video_links = COALESCE(?, video_links),
        song_links = COALESCE(?, song_links),
        activities = COALESCE(?, activities),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        bible_reading,
        video_links ? JSON.stringify(video_links) : null,
        song_links ? JSON.stringify(song_links) : null,
        activities ? JSON.stringify(activities) : null,
        notes,
        req.params.id
      ]
    );

    const updatedPlan = await dbGet('SELECT * FROM worship_plans WHERE id = ?', [req.params.id]);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Update worship plan error:', error);
    res.status(500).json({ error: 'Failed to update worship plan' });
  }
});

// Delete worship plan
router.delete('/plans/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM worship_plans WHERE id = ?', [req.params.id]);
    res.json({ message: 'Worship plan deleted successfully' });
  } catch (error) {
    console.error('Delete worship plan error:', error);
    res.status(500).json({ error: 'Failed to delete worship plan' });
  }
});

// Templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = await dbAll('SELECT * FROM worship_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/templates', authenticateToken, [
  body('name').notEmpty().withMessage('Template name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bible_reading, video_links, song_links, activities } = req.body;

    const result = await dbRun(
      `INSERT INTO worship_templates (user_id, name, bible_reading, video_links, song_links, activities)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        bible_reading || null,
        video_links ? JSON.stringify(video_links) : null,
        song_links ? JSON.stringify(song_links) : null,
        activities ? JSON.stringify(activities) : null
      ]
    );

    const template = await dbGet('SELECT * FROM worship_templates WHERE id = ?', [result.lastID]);
    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await dbAll('SELECT wl.*, wp.title as plan_title, e.title as event_title FROM worship_logs wl LEFT JOIN worship_plans wp ON wl.worship_plan_id = wp.id LEFT JOIN events e ON wl.event_id = e.id ORDER BY wl.created_at DESC');
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/logs', authenticateToken, [
  body('what_was_covered').notEmpty().withMessage('What was covered is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { worship_plan_id, event_id, participants, what_was_covered, reflections, notes } = req.body;

    const result = await dbRun(
      `INSERT INTO worship_logs (worship_plan_id, event_id, participants, what_was_covered, reflections, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        worship_plan_id || null,
        event_id || null,
        participants ? JSON.stringify(participants) : null,
        what_was_covered,
        reflections || null,
        notes || null
      ]
    );

    const log = await dbGet('SELECT * FROM worship_logs WHERE id = ?', [result.lastID]);
    res.status(201).json(log);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

export default router;
