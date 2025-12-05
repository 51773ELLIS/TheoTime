# Docker Deployment

## Quick Start

1. Copy `.env.example` to `.env` in the project root and configure:
   ```bash
   cp ../.env.example ../.env
   ```

2. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the application at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the project root with:

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
```

## Data Persistence

The database is stored in a Docker volume named `theotime-data`. To backup:

```bash
docker run --rm -v theotime_theotime-data:/data -v $(pwd):/backup alpine tar czf /backup/theotime-backup.tar.gz /data
```

To restore:

```bash
docker run --rm -v theotime_theotime-data:/data -v $(pwd):/backup alpine tar xzf /backup/theotime-backup.tar.gz -C /
```

## Building Manually

```bash
docker build -f docker/Dockerfile -t theotime:latest ..
docker run -d -p 3000:3000 -v theotime-data:/app/database theotime:latest
```
