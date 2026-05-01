# Docker Setup for BankChase

Complete Docker setup for running the full BankChase stack locally with FastAPI backend, Next.js frontend, PostgreSQL database, and Redis caching.

## Prerequisites

- Docker Desktop or Docker Engine (latest version)
- docker-compose (included with Docker Desktop)
- At least 4GB RAM available
- Ports 3000, 5432, 6379, 8000 available on localhost

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd bankchase
cp .env.example .env
```

### 2. Start All Services

```bash
# Build and start everything
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 4. Initialize Database

The database migrations run automatically on startup. To manually run migrations:

```bash
docker-compose exec api python scripts/run_migrations.py
```

To verify migrations:

```bash
docker-compose exec postgres psql -U postgres -d bankchase -c "\dt"
```

## Environment Configuration

All configuration is in `.env`. Edit before running `docker-compose up`:

```bash
# Database
DB_NAME=bankchase
DB_USER=postgres
DB_PASSWORD=postgres

# Auth Secrets (change in production!)
JWT_SECRET=your-secret-key-change-in-production
ADMIN_PASSWORD=changeme

# Optional: Notifications (add your API keys)
RESEND_API_KEY=your-resend-key
SLACK_WEBHOOK_URL=your-slack-webhook
TWILIO_ACCOUNT_SID=your-twilio-sid
```

## Services

### PostgreSQL Database
- Image: `postgres:16-alpine`
- Port: 5432
- Credentials: postgres/postgres (from .env)
- Volumes: Persistent storage in `postgres_data`
- Contains workflow tables, accounts, transfers, loans, disputes, etc.

### Redis Cache
- Image: `redis:7-alpine`
- Port: 6379
- Used for: Rate limiting, caching, sessions
- Volumes: Persistent storage in `redis_data`

### FastAPI Backend
- Build: From ./Dockerfile
- Port: 8000
- Features:
  - Workflow orchestration
  - API endpoints for workflows
  - Notifications (email, Slack, SMS)
  - Voice analysis
  - Rate limiting
  - Authentication

### Next.js Frontend
- Build: From ./frontend/Dockerfile
- Port: 3000
- Features:
  - Workflow dashboard
  - Real-time status updates
  - User interface for all workflows
  - Responsive design

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# Execute command in container
docker-compose exec api python -c "print('test')"

# Rebuild after changes
docker-compose up -d --build

# Remove everything (including volumes)
docker-compose down -v

# Check service status
docker-compose ps

# Health check
docker-compose ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # For port 3000
lsof -i :8000  # For port 8000
lsof -i :5432  # For port 5432

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check database logs
docker-compose logs postgres

# Verify database is running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### API Not Responding

```bash
# Check API logs
docker-compose logs api

# Verify API is healthy
curl http://localhost:8000/health

# Check database connection
docker-compose exec api python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
print('Connected!' if engine.connect() else 'Failed')
"
```

### Frontend Won't Load

```bash
# Check frontend logs
docker-compose logs web

# Clear Next.js cache
docker-compose exec web rm -rf .next

# Rebuild frontend
docker-compose up --build web
```

## Development Workflow

### Making Changes to Backend

```bash
# Edit code in ./backend
# Changes are reflected immediately (hot reload)
docker-compose logs -f api

# If you add dependencies:
docker-compose down
docker-compose up --build api
```

### Making Changes to Frontend

```bash
# Edit code in ./frontend
# Changes trigger Next.js hot reload
docker-compose logs -f web

# If you add dependencies:
docker-compose down
docker-compose up --build web
```

### Adding Database Migrations

```bash
# Create new SQL file in ./scripts
# e.g., 021_new_feature.sql

# Add to migration list in scripts/run_migrations.py
migration_order = [..., '021_new_feature.sql']

# Run migrations
docker-compose exec api python scripts/run_migrations.py
```

## Production Deployment

### Before Deploying

1. **Change all secrets**:
```bash
JWT_SECRET=<generate-new-secret>
ADMIN_PASSWORD=<secure-password>
WORKFLOW_API_KEY=<generate-new-key>
```

2. **Set proper environment**:
```bash
ENVIRONMENT=production
LOG_LEVEL=WARNING
NODE_ENV=production
```

3. **Configure external services**:
```bash
RESEND_API_KEY=<your-production-key>
SLACK_WEBHOOK_URL=<production-webhook>
TWILIO_ACCOUNT_SID=<production-sid>
```

4. **Use production database**:
```bash
DATABASE_URL=postgresql://user:password@prod-host:5432/bankchase
```

### Deployment Options

#### Option 1: Vercel + Cloud Database
- Deploy frontend to Vercel
- Deploy backend to Heroku/Railway/Render
- Use managed PostgreSQL (Neon/Supabase)

#### Option 2: Cloud Container Registry
```bash
# Build and push to registry
docker build -t bankchase-api:latest -f Dockerfile .
docker build -t bankchase-web:latest -f frontend/Dockerfile frontend/

docker tag bankchase-api:latest myregistry/bankchase-api:latest
docker push myregistry/bankchase-api:latest
```

#### Option 3: Docker Swarm/Kubernetes
- Use docker stack deploy for Swarm
- Create kubeconfig and deploy to EKS/GKE/AKS

## Monitoring

### Health Checks

All services include healthchecks:
```bash
# View health status
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
```

### Logs and Debugging

```bash
# All services
docker-compose logs -f

# Follow API logs with timestamps
docker-compose logs -f --timestamps api

# Last 100 lines
docker-compose logs --tail 100 api

# Filter by container
docker-compose logs api web
```

### Resource Monitoring

```bash
# CPU/Memory usage
docker stats

# Container details
docker inspect bankchase-api
docker inspect bankchase-web
docker inspect bankchase-db
```

## Performance Tips

1. **Limit database logs**: Set `LOG_LEVEL=WARNING` in production
2. **Enable Redis caching**: Configure cache TTLs in backend
3. **Use CDN for frontend**: Serve static assets from CDN
4. **Database optimization**: Add indexes for frequently queried columns
5. **API rate limiting**: Adjust rate limits based on load

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres bankchase > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres bankchase < backup.sql
```

### Backup Redis

```bash
docker-compose exec redis redis-cli BGSAVE
docker cp bankchase-redis:/data/dump.rdb ./redis-backup.rdb
```

## Support

For issues or questions:
1. Check Docker logs: `docker-compose logs`
2. Verify all services are healthy: `docker-compose ps`
3. Check environment variables: `docker-compose exec api env`
4. Review troubleshooting section above
