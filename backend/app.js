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
  app.use(express.static(staticPath));
}

// Initialize database
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TheoTime API is running' });
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
    res.sendFile(indexPath);
  });
} else {
  // 404 handler for API routes in development
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.listen(PORT, () => {
  console.log(`TheoTime backend server running on port ${PORT}`);
});
