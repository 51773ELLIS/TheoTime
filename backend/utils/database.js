import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../../database/theotime.sqlite');

// Ensure database directory exists
const ensureDatabaseDirectory = async () => {
  const dbDir = dirname(DB_PATH);
  if (!existsSync(dbDir)) {
    try {
      await mkdir(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    } catch (err) {
      console.error(`Failed to create database directory: ${dbDir}`, err);
      throw err;
    }
  }
};

let db = null;

export const getDatabase = () => {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
};

// Promisify database methods
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    getDatabase().run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    getDatabase().get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    getDatabase().all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const initializeDatabase = async () => {
  // Ensure database directory exists before creating database
  await ensureDatabaseDirectory();
  const db = getDatabase();

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'child',
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Children profiles table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS children_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      age INTEGER,
      interests TEXT,
      favorite_characters TEXT,
      favorite_stories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Events table (worship nights, personal study, etc.)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME,
      is_recurring BOOLEAN DEFAULT 0,
      recurrence_pattern TEXT,
      color TEXT,
      reminder_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Worship plans table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS worship_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      title TEXT NOT NULL,
      bible_reading TEXT,
      video_links TEXT,
      song_links TEXT,
      activities TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // Worship templates table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS worship_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      bible_reading TEXT,
      video_links TEXT,
      song_links TEXT,
      activities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Worship logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS worship_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worship_plan_id INTEGER,
      event_id INTEGER,
      participants TEXT,
      what_was_covered TEXT,
      reflections TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worship_plan_id) REFERENCES worship_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);
  
  // Add missing columns to worship_logs table (for migration)
  try {
    await dbRun(`ALTER TABLE worship_logs ADD COLUMN future_thoughts TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  
  try {
    await dbRun(`ALTER TABLE worship_logs ADD COLUMN is_completed BOOLEAN DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  
  // Add is_completed column to events if it doesn't exist (for migration)
  try {
    await dbRun(`ALTER TABLE events ADD COLUMN is_completed BOOLEAN DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Homework/Assignments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assigned_to INTEGER NOT NULL,
      assigned_by INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL,
      due_date DATETIME,
      completed BOOLEAN DEFAULT 0,
      completed_at DATETIME,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Spiritual goals table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS spiritual_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date DATETIME,
      completed BOOLEAN DEFAULT 0,
      completed_at DATETIME,
      progress_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Settings table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notifications table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      related_id INTEGER,
      related_type TEXT,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notification preferences table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      reminder_minutes INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, notification_type)
    )
  `);

  // Create indexes for better performance
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_homework_assigned_to ON homework(assigned_to)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_spiritual_goals_user_id ON spiritual_goals(user_id)`);

  // Search indexes for full-text search capabilities
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_title ON events(title)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_description ON events(description)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_homework_title ON homework(title)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_homework_description ON homework(description)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_spiritual_goals_title ON spiritual_goals(title)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_spiritual_goals_description ON spiritual_goals(description)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_worship_plans_title ON worship_plans(title)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_events_is_completed ON events(is_completed)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_homework_completed ON homework(completed)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_spiritual_goals_completed ON spiritual_goals(completed)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id)`);

  console.log('Database schema initialized');
};
