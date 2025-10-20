# 🐳 Docker Setup Guide

This guide explains how to run the GPS Shortest Path application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB free disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kubilayguler/gps-shortest-path.git
cd gps-shortest-path
```

### 2. Create Environment Files

```bash
# Backend environment (optional - has defaults in docker-compose.yml)
cp backend/.env.example backend/.env

# Frontend environment (optional - has defaults in docker-compose.yml)
cp frontend/.env.example frontend/.env.local
```

### 3. Build and Start Services

```bash
# Build and start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

**Wait for services to start:**
- PostgreSQL: http://localhost:5432
- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

### 4. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Docker Compose Services

### PostgreSQL Database
- **Container:** gps-postgres
- **Port:** 5432
- **Database:** gps_shortest_path
- **User:** postgres
- **Password:** postgres (change in production!)
- **Volume:** Persistent storage in `postgres_data`

### Backend API
- **Container:** gps-backend
- **Port:** 5000
- **Environment:** Production mode
- **Dependencies:** Waits for PostgreSQL to be healthy

### Frontend Application
- **Container:** gps-frontend
- **Port:** 3000
- **Environment:** Production mode
- **Dependencies:** Waits for Backend to start

## Common Commands

### Start Services
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up --build
```

### Execute Commands in Containers
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d gps_shortest_path

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Run migrations
docker-compose exec backend npm run migrate
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gps_shortest_path
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=production
```

## Database Initialization

The PostgreSQL container automatically runs SQL scripts from `backend/migrations/` on first startup.

To manually run migrations:
```bash
docker-compose exec postgres psql -U postgres -d gps_shortest_path -f /docker-entrypoint-initdb.d/your_migration.sql
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
# Windows PowerShell
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
ports:
  - "5001:5000"  # Host:Container
```

### Database Connection Errors
```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend Not Loading
```bash
# Check if backend is running
curl http://localhost:5000/api

# Rebuild frontend
docker-compose build frontend
docker-compose up frontend
```

### Clear Everything and Start Fresh
```bash
# Stop and remove everything
docker-compose down -v --rmi all

# Remove dangling images
docker image prune -f

# Rebuild and start
docker-compose up --build
```

## Production Deployment

### Update docker-compose.yml for Production

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Use secrets
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data  # Host volume

  backend:
    environment:
      NODE_ENV: production
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: https://your-domain.com
    restart: always

  frontend:
    environment:
      NEXT_PUBLIC_API_URL: https://api.your-domain.com
    restart: always
```

### Use Docker Secrets
```bash
# Create secrets
echo "your_db_password" | docker secret create db_password -

# Update docker-compose.yml to use secrets
secrets:
  db_password:
    external: true
```

### Health Checks
```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/api"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Resource Limits
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## Backup and Restore

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres gps_shortest_path > backup.sql

# Or with Docker
docker-compose exec -T postgres pg_dump -U postgres gps_shortest_path > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres gps_shortest_path < backup.sql
```

## Performance Optimization

### Enable BuildKit
```bash
# Add to ~/.bashrc or ~/.zshrc
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Multi-stage Build Cache
```dockerfile
# Already implemented in Dockerfiles
FROM node:18-alpine AS base
FROM base AS deps
FROM base AS builder
FROM base AS runner
```

### Volume Caching (for development)
```yaml
volumes:
  - ./backend:/app
  - /app/node_modules  # Anonymous volume for node_modules
```

## Monitoring

### View Resource Usage
```bash
# Container stats
docker stats

# Specific container
docker stats gps-backend
```

### Inspect Containers
```bash
# Container details
docker inspect gps-backend

# Network details
docker network inspect gps-network
```

## Development with Docker

### Hot Reload Setup
```yaml
# docker-compose.dev.yml
services:
  backend:
    command: npm run dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development

  frontend:
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      NODE_ENV: development
```

```bash
# Run development setup
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend npm test
```

## Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Hub](https://hub.docker.com/_/node)

## Support

For Docker-specific issues:
- Check logs: `docker-compose logs -f`
- Restart services: `docker-compose restart`
- Clean rebuild: `docker-compose down -v && docker-compose up --build`

For application issues, see main [README.md](README.md)
