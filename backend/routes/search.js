import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dbAll } from '../utils/database.js';

const router = express.Router();

// Search across multiple entities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${q.trim()}%`;
    const results = {
      events: [],
      homework: [],
      worship_plans: [],
      spiritual_goals: []
    };

    // Build user filter (parents see all, others see only their own)
    const userFilter = req.user.role !== 'parent' 
      ? ' AND (user_id = ? OR user_id IS NULL)' 
      : '';

    // Search events
    if (!type || type === 'events') {
      const events = await dbAll(
        `SELECT e.*, 
         (SELECT wp.id FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_id,
         (SELECT wp.title FROM worship_plans wp WHERE wp.event_id = e.id LIMIT 1) as worship_plan_title
         FROM events e 
         WHERE (e.title LIKE ? OR e.description LIKE ?) ${userFilter}
         ORDER BY e.start_date DESC
         LIMIT 20`,
        req.user.role !== 'parent' 
          ? [searchTerm, searchTerm, req.user.id]
          : [searchTerm, searchTerm]
      );
      results.events = events.map(e => ({ ...e, result_type: 'event' }));
    }

    // Search homework
    if (!type || type === 'homework') {
      const homework = await dbAll(
        `SELECT h.*, 
         u1.username as assigned_to_username, 
         u2.username as assigned_by_username 
         FROM homework h 
         LEFT JOIN users u1 ON h.assigned_to = u1.id 
         LEFT JOIN users u2 ON h.assigned_by = u2.id 
         WHERE (h.title LIKE ? OR h.description LIKE ?) ${userFilter}
         ORDER BY h.due_date DESC
         LIMIT 20`,
        req.user.role !== 'parent'
          ? [searchTerm, searchTerm, req.user.id]
          : [searchTerm, searchTerm]
      );
      results.homework = homework.map(h => ({ ...h, result_type: 'homework' }));
    }

    // Search worship plans
    if (!type || type === 'worship_plans') {
      const worshipPlans = await dbAll(
        `SELECT wp.*, e.title as event_title, e.start_date 
         FROM worship_plans wp 
         LEFT JOIN events e ON wp.event_id = e.id 
         WHERE (wp.title LIKE ? OR wp.bible_reading LIKE ? OR wp.notes LIKE ?)
         ORDER BY wp.created_at DESC
         LIMIT 20`,
        [searchTerm, searchTerm, searchTerm]
      );
      results.worship_plans = worshipPlans.map(wp => ({ ...wp, result_type: 'worship_plan' }));
    }

    // Search spiritual goals
    if (!type || type === 'spiritual_goals') {
      const goals = await dbAll(
        `SELECT * FROM spiritual_goals 
         WHERE (title LIKE ? OR description LIKE ?) ${userFilter}
         ORDER BY created_at DESC
         LIMIT 20`,
        req.user.role !== 'parent'
          ? [searchTerm, searchTerm, req.user.id]
          : [searchTerm, searchTerm]
      );
      results.spiritual_goals = goals.map(g => ({ ...g, result_type: 'spiritual_goal' }));
    }

    // Calculate total count
    const totalCount = results.events.length + 
                      results.homework.length + 
                      results.worship_plans.length + 
                      results.spiritual_goals.length;

    res.json({
      query: q,
      total: totalCount,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
