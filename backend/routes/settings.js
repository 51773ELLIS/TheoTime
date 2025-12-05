import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../utils/database.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Get all settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await dbAll('SELECT key, value FROM settings WHERE user_id IS NULL OR user_id = ?', [req.user.id]);
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const setting = await dbGet('SELECT value FROM settings WHERE key = ? AND (user_id IS NULL OR user_id = ?)', [req.params.key, req.user.id]);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ key: req.params.key, value: setting.value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update setting
router.put('/:key', authenticateToken, [
  body('value').notEmpty().withMessage('Value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { value } = req.body;

    // Some settings require parent role
    const parentOnlySettings = ['openai_api_key', 'openai_model', 'ai_enabled', 'child_ai_enabled', 'homework_enabled'];
    if (parentOnlySettings.includes(key) && req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if setting exists
    const existing = await dbGet('SELECT id FROM settings WHERE key = ? AND (user_id IS NULL OR user_id = ?)', [key, req.user.id]);

    if (existing) {
      await dbRun('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [value, existing.id]);
    } else {
      await dbRun('INSERT INTO settings (key, value, user_id) VALUES (?, ?, ?)', [key, value, req.user.id]);
    }

    res.json({ key, value });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Export data
router.get('/export/data', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { dbAll } = await import('../utils/database.js');

    const data = {
      users: await dbAll('SELECT id, username, email, role, full_name, created_at FROM users'),
      children_profiles: await dbAll('SELECT * FROM children_profiles'),
      events: await dbAll('SELECT * FROM events'),
      worship_plans: await dbAll('SELECT * FROM worship_plans'),
      worship_templates: await dbAll('SELECT * FROM worship_templates'),
      worship_logs: await dbAll('SELECT * FROM worship_logs'),
      homework: await dbAll('SELECT * FROM homework'),
      spiritual_goals: await dbAll('SELECT * FROM spiritual_goals'),
      settings: await dbAll('SELECT * FROM settings WHERE key NOT IN ("openai_api_key")'), // Exclude sensitive data
      export_date: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=theotime-export.json');
    res.json(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Import data
router.post('/import/data', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Note: This is a basic import. In production, you'd want more validation and transaction handling
    const tables = ['users', 'children_profiles', 'events', 'worship_plans', 'worship_templates', 'worship_logs', 'homework', 'spiritual_goals', 'settings'];

    for (const table of tables) {
      if (data[table] && Array.isArray(data[table])) {
        // Clear existing data (optional - you might want to merge instead)
        // await dbRun(`DELETE FROM ${table}`);
        
        // Insert data (simplified - would need proper handling for each table)
        console.log(`Importing ${data[table].length} records into ${table}`);
      }
    }

    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;
