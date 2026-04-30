# Production Deployment Guide

## Chase Bank Voice Agent Platform - Production Ready

This guide covers deploying the Chase Bank Voice Agent Platform to production with security, scalability, and reliability in mind.

## Prerequisites

- GitHub account with repository access
- Vercel account (for frontend hosting)
- Railway or similar service (for backend)
- PostgreSQL database (Supabase or similar)
- Domain name for production environment

## Frontend Deployment (Vercel)

### Step 1: Connect GitHub Repository

```bash
# Push code to GitHub
git add .
git commit -m "feat: complete voice banking platform"
git push origin main
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod
```

### Step 3: Configure Environment Variables

Set these in Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-hex-32>
DATABASE_URL=<postgresql-connection-string>
```

### Step 4: Enable Analytics & Monitoring

- Set up Vercel Analytics for performance monitoring
- Enable Web Vitals tracking
- Configure error tracking integration

## Backend Deployment (FastAPI + Railway)

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### Step 2: Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/pyproject.toml .
COPY backend/uv.lock .

RUN pip install uv
RUN uv sync --frozen

COPY backend/ .

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Deploy Backend

```bash
# In Railway dashboard:
# 1. Connect GitHub repository
# 2. Select backend folder
# 3. Set environment variables
# 4. Deploy

# Or via CLI:
railway up
```

### Step 4: Configure Railway Postgres Plugin

- Add Postgres plugin in Railway dashboard
- Copy `DATABASE_URL` from plugin variables
- Set as environment variable in FastAPI service

## Database Setup (PostgreSQL)

### Step 1: Initialize Database

```bash
# Run migrations
python scripts/run_migrations.py

# Set environment
export POSTGRES_URL=<your-database-url>

# Run with proper credentials
python -c "
import asyncpg
import asyncio

async def init():
    conn = await asyncpg.connect(os.getenv('POSTGRES_URL'))
    with open('scripts/010_consolidated_schema.sql') as f:
        await conn.execute(f.read())
    await conn.close()

asyncio.run(init())
"
```

### Step 2: Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Backup & Recovery

```bash
# Daily backups
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip backup_20240429.sql.gz
psql $DATABASE_URL < backup_20240429.sql
```

## Security Configuration

### Step 1: CORS Setup

```python
# In main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Rate Limiting

```python
# Install redis
# pip install slowapi

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request):
    pass
```

### Step 3: SSL/TLS Certificates

- Vercel automatically manages SSL for frontend
- Railway automatically manages SSL for backend
- Both use Cloudflare DNS for DDoS protection

### Step 4: API Key Management

```python
# Use environment variables for sensitive data
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
VOICE_API_KEY = os.getenv("VOICE_API_KEY")

# Rotate quarterly
# Store in 1Password or similar
```

## Monitoring & Observability

### Step 1: Application Monitoring

```bash
# Add Sentry for error tracking
pip install sentry-sdk

import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=0.1
)
```

### Step 2: Database Monitoring

```bash
# Monitor query performance
EXPLAIN ANALYZE SELECT * FROM accounts WHERE org_id = 'org123';

# Add indexes for frequently queried columns
CREATE INDEX idx_accounts_org_id ON accounts(org_id);
CREATE INDEX idx_demo_transfers_status ON demo_transfers(status);
```

### Step 3: Real-time Alerts

Configure alerts in Vercel/Railway/Sentry:
- Response time > 2s
- Error rate > 1%
- Database connection pool exhaustion
- Memory usage > 80%

### Step 4: Log Aggregation

```bash
# Use structured logging
import structlog

structlog.configure()
logger = structlog.get_logger()

logger.info("user_login", user_id="user123", org_id="org456")
```

## Scaling Considerations

### Frontend (Vercel)

- Automatic edge caching with Vercel Edge Network
- Automatic image optimization
- Built-in CDN for static assets
- Auto-scaling based on traffic

### Backend (Railway/Similar)

```yaml
# Add horizontal scaling
services:
  api:
    replicas: 3
    resources:
      cpu: 500m
      memory: 512Mi
```

### Database

```sql
-- Connection pooling
-- Use PgBouncer or similar
-- Max connections: 100
-- Min connections: 10
-- Idle timeout: 10min

-- Partitioning for large tables
CREATE TABLE transactions_2024_04 PARTITION OF transactions
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
```

## Health Checks

### Frontend Health

```typescript
// app/health/route.ts
export async function GET() {
  const dbHealth = await checkDatabase();
  const apiHealth = await checkBackendAPI();
  
  return Response.json({
    status: dbHealth && apiHealth ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
  });
}
```

### Backend Health

```python
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }
```

## Rollback Procedure

### Frontend Rollback (Vercel)

1. Vercel Dashboard → Deployments
2. Select previous stable deployment
3. Click "Promote to Production"
4. Takes effect immediately

### Backend Rollback (Railway)

1. Railway Dashboard → Deployments
2. Select previous working deployment
3. Click "Redeploy"
4. Monitor logs during transition

### Database Rollback

```bash
# If schema migration failed:
# 1. Stop application
# 2. Restore from backup
# 3. Verify data integrity
# 4. Restart application

# Quick rollback of migrations
python scripts/rollback_migration.py --version=010
```

## Performance Optimization

### Frontend

- Enable Next.js Image Optimization
- Use dynamic imports for code splitting
- Enable SWR caching with stale-while-revalidate
- Compress response with gzip

### Backend

- Use connection pooling (PgBouncer)
- Cache responses with Redis
- Use async database queries
- Implement request timeout (30s default)

## Security Checklist

- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured to specific domain
- [ ] Rate limiting enabled on auth endpoints
- [ ] Database passwords rotated
- [ ] API keys stored in environment variables
- [ ] Audit logging enabled
- [ ] Data encryption at rest (database)
- [ ] Data encryption in transit (TLS 1.3)
- [ ] Regular security scans enabled
- [ ] Incident response plan documented
- [ ] DDoS protection via Cloudflare
- [ ] Two-factor authentication for admin accounts

## Maintenance Tasks

### Weekly

- Monitor error rates and performance metrics
- Review security logs for anomalies
- Check database connection pool health

### Monthly

- Update dependencies (security patches)
- Review and optimize slow queries
- Test backup restoration procedure
- Rotate credentials if needed

### Quarterly

- Full security audit
- Performance benchmarking
- Capacity planning review
- Disaster recovery drill

## Support & Escalation

**Critical Issues:** Trigger automatic page alert via PagerDuty
**High Priority:** Email + Slack notification
**Medium Priority:** Slack channel notification
**Low Priority:** GitHub issue creation

Contact: ops@bankchase.example.com

---

**Deployment Date:** [Insert Date]
**Version:** 1.0.0
**Last Updated:** 2024-04-29
