# TheoTime Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- (Optional) Docker and Docker Compose for containerized deployment

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DB_PATH=./database/theotime.sqlite
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Servers

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`

## Production Build

### 1. Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with the production build.

### 2. Start Backend

```bash
cd backend
npm start
```

The backend will serve the frontend build from the `public` directory.

## Docker Deployment

### Quick Start

```bash
cd docker
docker-compose up -d
```

### Manual Build

```bash
docker build -f docker/Dockerfile -t theotime:latest .
docker run -d -p 3000:3000 -v theotime-data:/app/database theotime:latest
```

## First-Time Setup

1. Access the application at `http://localhost:3000`
2. Register the first user (this will be a parent/admin account)
3. Configure settings:
   - Set default worship night
   - (Optional) Add OpenAI API key for AI features
   - Add additional users (children)
4. Start planning your Family Worship!

## Database

The SQLite database is stored at `./database/theotime.sqlite` (or `/app/database/theotime.sqlite` in Docker).

### Backup

```bash
# Local
cp database/theotime.sqlite database/theotime-backup-$(date +%Y%m%d).sqlite

# Docker
docker exec theotime cp /app/database/theotime.sqlite /app/database/theotime-backup-$(date +%Y%m%d).sqlite
```

### Restore

```bash
# Local
cp database/theotime-backup-YYYYMMDD.sqlite database/theotime.sqlite

# Docker
docker exec theotime cp /app/database/theotime-backup-YYYYMMDD.sqlite /app/database/theotime.sqlite
```

## Security Notes

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production (reverse proxy with nginx/traefik)
3. **Backup database** regularly
4. **Keep dependencies updated**

## Troubleshooting

### Database Issues

If the database doesn't initialize:
- Check write permissions on `database/` directory
- Ensure SQLite3 is installed

### Port Conflicts

If port 3000 is in use:
- Change `PORT` in `.env`
- Update `VITE_API_URL` in frontend `.env` if needed

### CORS Issues

In development, the frontend proxy handles CORS. In production, ensure your reverse proxy is configured correctly.

## Reverse Proxy (Nginx Example)

```nginx
server {
    listen 80;
    server_name theotime.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Support

For issues or questions, please refer to the main README.md file.
