import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { dbGet, dbAll } from '../utils/database.js';

const router = express.Router();

// Get analytics dashboard data (parents only)
router.get('/', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to last 30 days if not specified
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // Event statistics
    const eventStats = await dbGet(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN event_type = 'worship' THEN 1 ELSE 0 END) as worship_events,
        SUM(CASE WHEN event_type = 'personal_study' THEN 1 ELSE 0 END) as study_events,
        SUM(CASE WHEN event_type = 'meeting' THEN 1 ELSE 0 END) as meeting_events,
        SUM(CASE WHEN event_type = 'ministry' THEN 1 ELSE 0 END) as ministry_events
       FROM events 
       WHERE start_date >= ? AND start_date <= ?`,
      [startDate, endDate]
    );

    // Homework statistics
    const homeworkStats = await dbGet(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = 0 AND due_date < date('now') THEN 1 ELSE 0 END) as overdue
       FROM homework 
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDate]
    );

    // Worship completion rate
    const worshipCompletion = await dbGet(
      `SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN wl.is_completed = 1 THEN e.id END) as completed_events
       FROM events e
       LEFT JOIN worship_logs wl ON e.id = wl.event_id
       WHERE e.event_type = 'worship' 
         AND e.start_date >= ? AND e.start_date <= ?`,
      [startDate, endDate]
    );

    // Spiritual goals progress
    const goalsStats = await dbGet(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
       FROM spiritual_goals 
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDate]
    );

    // Activity by user (for parents)
    const activityByUser = await dbAll(
      `SELECT 
        u.id,
        u.username,
        u.role,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT h.id) as homework_count,
        SUM(CASE WHEN e.is_completed = 1 THEN 1 ELSE 0 END) as completed_events
       FROM users u
       LEFT JOIN events e ON u.id = e.user_id AND e.start_date >= ? AND e.start_date <= ?
       LEFT JOIN homework h ON u.id = h.assigned_to AND h.created_at >= ? AND h.created_at <= ?
       WHERE u.role != 'parent'
       GROUP BY u.id, u.username, u.role
       ORDER BY event_count DESC, homework_count DESC`,
      [startDate, endDate, startDate, endDate]
    );

    // Recent activity timeline
    const recentActivity = await dbAll(
      `SELECT 
        'event' as type,
        e.id,
        e.title,
        e.start_date as date,
        e.user_id,
        u.username
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.start_date >= ? AND e.start_date <= ?
       UNION ALL
       SELECT 
        'homework' as type,
        h.id,
        h.title,
        h.due_date as date,
        h.assigned_to as user_id,
        u.username
       FROM homework h
       LEFT JOIN users u ON h.assigned_to = u.id
       WHERE h.created_at >= ? AND h.created_at <= ?
       ORDER BY date DESC
       LIMIT 20`,
      [startDate, endDate, startDate, endDate]
    );

    res.json({
      period: {
        start_date: startDate,
        end_date: endDate
      },
      events: eventStats,
      homework: homeworkStats,
      worship: {
        total: worshipCompletion.total_events || 0,
        completed: worshipCompletion.completed_events || 0,
        completion_rate: worshipCompletion.total_events > 0 
          ? ((worshipCompletion.completed_events || 0) / worshipCompletion.total_events * 100).toFixed(1)
          : 0
      },
      spiritual_goals: goalsStats,
      activity_by_user: activityByUser,
      recent_activity: recentActivity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
