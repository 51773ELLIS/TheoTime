import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeDatabase } from './utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import worshipRoutes from './routes/worship.js';
import homeworkRoutes from './routes/homework.js';
import childrenRoutes from './routes/children.js';
import aiRoutes from './routes/ai.js';
import settingsRoutes from './routes/settings.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import { runNotificationChecks } from './utils/notificationService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build in production
// In Docker: /app/public, in local: ../public or ./public
if (process.env.NODE_ENV === 'production') {
  const publicPath = join(__dirname, 'public');
  const altPublicPath = join(__dirname, '../public');
  
  // Try current directory first (Docker), then parent directory (local)
  const staticPath = existsSync(publicPath) ? publicPath : altPublicPath;
  
  if (existsSync(staticPath)) {
    app.use(express.static(staticPath));
  } else {
    console.warn(`Warning: Static file directory not found at ${publicPath} or ${altPublicPath}`);
  }
}

// Initialize database
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
  
  // Start notification scheduler (check every 15 minutes)
  setInterval(async () => {
    try {
      await runNotificationChecks();
    } catch (error) {
      console.error('Notification check error:', error);
    }
  }, 15 * 60 * 1000); // 15 minutes
  
  // Run initial check after 1 minute
  setTimeout(async () => {
    try {
      await runNotificationChecks();
    } catch (error) {
      console.error('Initial notification check error:', error);
    }
  }, 60 * 1000);
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/worship', worshipRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TheoTime API is running' });
});

// 404 handler for API routes (before SPA fallback)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !res.headersSent) {
    return res.status(404).json({ error: 'API route not found' });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Serve frontend in production (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  const publicPath = join(__dirname, 'public');
  const altPublicPath = join(__dirname, '../public');
  const indexPath = existsSync(publicPath) 
    ? join(publicPath, 'index.html')
    : join(altPublicPath, 'index.html');
  
  app.get('*', (req, res) => {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(404).json({ error: 'Frontend not found. Please rebuild the frontend.' });
      }
    });
  });
} else {
  // 404 handler for non-API routes in development
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for network access
app.listen(PORT, HOST, () => {
  console.log(`TheoTime backend server running on http://${HOST}:${PORT}`);
});
