# TheoTime Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set a secure JWT_SECRET (optional, defaults work for development)
# JWT_SECRET=your-secret-key-here
```

### Step 3: Start Development Servers

```bash
# Start both backend and frontend
npm run dev
```

This will start:
- ✅ Backend API: `http://localhost:3000`
- ✅ Frontend App: `http://localhost:5173`

### Step 4: Create Your First Account

1. Open `http://localhost:5173` in your browser
2. Click "Register as Parent" on the login page
3. Fill in:
   - Username (required)
   - Password (min 6 characters)
   - Email (optional)
   - Full Name (optional)
4. Click "Register"

You'll be automatically logged in as a parent/admin.

### Step 5: Configure Your App

1. Go to **Settings** (top navigation)
2. Set your preferences:
   - Default Worship Night (e.g., Sunday)
   - Theme (Light/Dark)
   - Enable features (Homework, AI Assistant)
3. (Optional) Add OpenAI API key for AI features
4. Add additional users (children) if needed

### Step 6: Start Using TheoTime!

- 📅 **Calendar**: Add worship nights and events
- 📋 **Worship Planner**: Create worship plans with Bible readings, videos, and activities
- 📝 **Homework**: Assign spiritual homework to children
- 🧒 **Children**: Manage profiles and track spiritual goals
- 🤖 **AI Assistant**: Get AI-powered suggestions (if configured)
- ⚙️ **Settings**: Manage users and export/import data

## 📱 Mobile Access

The app is fully responsive! Access it from any device on your local network:
- Desktop: `http://localhost:5173`
- Mobile: `http://YOUR-COMPUTER-IP:5173`

## 🐳 Docker Quick Start

If you prefer Docker:

```bash
cd docker
docker-compose up -d
```

Access at `http://localhost:3000`

## ❓ Troubleshooting

**Port already in use?**
- Change `PORT` in `.env` (backend)
- Frontend uses Vite's default port (5173)

**Database errors?**
- Ensure `database/` directory exists and is writable
- Check that SQLite3 is installed: `sqlite3 --version`

**Can't login?**
- Make sure you've registered an account first
- Check browser console for errors

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `DEPLOYMENT.md` for production setup
- Review `docker/README.md` for Docker deployment

## 🎉 You're Ready!

Start planning your Family Worship and tracking spiritual growth with TheoTime!
