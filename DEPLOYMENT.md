# Chase Bank Voice Agent - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- Python 3.11+ or Docker/Docker Compose
- PostgreSQL 12+ (for local dev) or Docker PostgreSQL image
- 4GB RAM minimum, 8GB recommended
- 10GB disk space for database and logs

### Required Tools
- Git
- Python pip or Docker
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL client tools (optional, for debugging)

### API Keys & Credentials
- JWT_SECRET (generate a strong 32+ character secret)
- Database credentials (create a strong password)
- Admin credentials (email/password for initial login)

---

## Local Development Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd bankchase

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Add slowapi and passlib
pip install slowapi passlib[bcrypt]
```

### 2. Environment Configuration

```bash
# Create .env file in project root
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bankchase
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/bankchase
DB_NAME=bankchase
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-min-32-characters-long-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password-change-this

# Environment
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# Features
ENABLE_BIOMETRIC=true
ENABLE_BEHAVIORAL_DRIFT=true
ENABLE_LIVENESS_DETECTION=true
ENABLE_WEBHOOKS=true
EOF
```

### 3. Database Setup (Local PostgreSQL)

```bash
# Start PostgreSQL (if not running)
# On macOS with Homebrew:
brew services start postgresql

# Create database
createdb -U postgres bankchase

# Run migrations
cd scripts
python run_migrations.py

# Seed initial data
python seed_banks.py
```

### 4. Start Development Server

```bash
# From project root
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Create .env file (as shown above)
cp .env.example .env

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f api

# Run migrations (automatic on startup)
docker-compose exec api python scripts/run_migrations.py

# Seed data
docker-compose exec api python scripts/seed_banks.py

# Check status
docker-compose ps
```

### Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| api | 8000 | FastAPI application |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Rate limiting & caching |

### Common Docker Commands

```bash
# View logs
docker-compose logs api

# Restart service
docker-compose restart api

# Stop all services
docker-compose down

# Remove all data (WARNING: deletes database)
docker-compose down -v

# Build fresh image
docker-compose build --no-cache

# Run command in container
docker-compose exec api python scripts/run_migrations.py
```

---

## Production Deployment

### Option 1: AWS EC2

```bash
# 1. Launch EC2 instance
# - Ubuntu 22.04 LTS
# - t3.medium or larger
# - Security group: allow 80, 443, 22

# 2. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clone repository
git clone <repository-url>
cd bankchase

# 6. Create production .env
nano .env  # Add production environment variables

# 7. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes (EKS, GKE, etc.)

```bash
# Create namespace
kubectl create namespace bankchase

# Create ConfigMap for non-secret config
kubectl create configmap bankchase-config \
  --from-literal=ENVIRONMENT=production \
  --from-literal=LOG_LEVEL=INFO \
  -n bankchase

# Create Secret for sensitive data
kubectl create secret generic bankchase-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=ADMIN_PASSWORD="..." \
  -n bankchase

# Deploy using manifests in k8s/ directory
kubectl apply -f k8s/
```

### Option 3: Vercel with Custom Backend

```bash
# Deploy Python backend on Vercel
vercel --env DATABASE_URL=... --env JWT_SECRET=...

# Or use AWS Lambda + RDS
# See serverless.yml for configuration
```

---

## Environment Variables

### Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | JWT signing secret (min 32 chars) | abc123def456ghi789jkl012mno345pqr |
| ADMIN_EMAIL | Initial admin email | admin@bank.com |
| ADMIN_PASSWORD | Initial admin password | SecurePass123! |

### Optional (Development)

| Variable | Default | Description |
|----------|---------|-------------|
| ENVIRONMENT | development | development/staging/production |
| LOG_LEVEL | INFO | DEBUG/INFO/WARNING/ERROR |
| JWT_EXPIRATION | 86400 | Token expiration in seconds (24h) |
| ENABLE_BIOMETRIC | true | Enable biometric auth |
| ENABLE_BEHAVIORAL_DRIFT | true | Enable drift detection |
| ENABLE_LIVENESS_DETECTION | true | Enable video liveness check |
| ENABLE_WEBHOOKS | true | Enable webhook system |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| WEBHOOK_RETRY_MAX | 3 | Max webhook retries |
| WEBHOOK_TIMEOUT | 30 | Webhook timeout in seconds |

### Generating Secrets

```bash
# Generate strong JWT_SECRET
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use openssl
openssl rand -base64 32
```

---

## Database Setup

### Migration Steps

```bash
# 1. Create database
createdb -U postgres bankchase

# 2. Run all migrations (order matters!)
python scripts/run_migrations.py

# 3. Verify tables created
psql -U postgres -d bankchase -c "\dt"

# Expected tables:
# - users
# - accounts
# - transactions
# - webhooks
# - behavioral_baselines
# - drift_audit_log
# - user_pins
# - pin_attempt_log
# - receipts
```

### Database Backup & Restore

```bash
# Backup
pg_dump -U postgres -d bankchase > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d bankchase < backup_20240101.sql

# Automated daily backup
0 2 * * * pg_dump -U postgres bankchase > /backups/bankchase_$(date +\%Y\%m\%d).sql
```

---

## Monitoring and Logging

### Health Checks

```bash
# API health endpoint
curl http://localhost:8000/health

# Database connectivity check
curl http://localhost:8000/health/db

# Response should be: {"status":"healthy"}
```

### Logging Configuration

```bash
# View application logs
docker-compose logs -f api

# View specific error logs
docker-compose logs api | grep ERROR

# Log files (inside container)
/app/logs/bankchase.log
```

### Monitoring Setup

#### Prometheus Metrics
```python
# Add to main.py
from prometheus_client import Counter, Histogram

request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')
```

#### Datadog Integration
```bash
# Set environment variables
export DD_API_KEY=your-key
export DD_APP_KEY=your-app-key

# Install agent
pip install datadog
```

#### New Relic Integration
```bash
pip install newrelic
newrelic-admin run-program python -m uvicorn main:app
```

---

## Security Checklist

### Before Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Review environment variables
- [ ] Scan dependencies for vulnerabilities
- [ ] Enable database encryption
- [ ] Configure database backups
- [ ] Set up VPN/private network access
- [ ] Enable CloudTrail/audit logs

### Ongoing Security

```bash
# Scan for vulnerabilities
pip install safety
safety check

# Check for outdated packages
pip list --outdated

# Update dependencies
pip install --upgrade -r backend/requirements.txt

# Review logs regularly
docker-compose logs api | grep -i error
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d bankchase -c "SELECT 1"

# Check connection string
echo $DATABASE_URL

# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### API Not Starting

```bash
# Check logs
docker-compose logs api

# Common issues:
# 1. Port already in use: lsof -i :8000
# 2. Missing dependencies: pip install -r requirements.txt
# 3. Invalid DATABASE_URL: echo $DATABASE_URL
```

### Rate Limiting Not Working

```bash
# Check Redis connection
redis-cli ping

# Clear rate limit cache
redis-cli FLUSHDB

# Verify slowapi installed
pip show slowapi
```

### PIN Validation Errors

```bash
# Check PIN tables exist
psql -U postgres -d bankchase -c "SELECT * FROM user_pins"

# Reset PIN lockout
psql -U postgres -d bankchase -c \
  "UPDATE user_pins SET locked_until = NULL WHERE user_id = 'user123'"
```

### Migration Issues

```bash
# Check migration status
psql -U postgres -d bankchase -c "SELECT * FROM migrations"

# Re-run migrations
python scripts/run_migrations.py

# View migration SQL
cat scripts/012_create_user_pins_table.sql
```

---

## Performance Tuning

### Database Optimization

```sql
-- Create indexes for faster queries
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_pin_attempts_user ON pin_attempt_log(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 'user123';
```

### API Optimization

```python
# Enable gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add caching headers
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

FastAPICache2.init(RedisBackend(redis), prefix="fastapi-cache")
```

### Connection Pooling

```python
# Adjust pool settings in database.py
pool = await asyncpg.create_pool(
    DATABASE_URL,
    min_size=5,      # Increase from 1
    max_size=20,     # Increase from 10
    max_queries=50000,
    max_cached_statement_lifetime=3600,
    max_cacheable_statement_size=15000
)
```

---

## Rollback Procedures

### If Deployment Fails

```bash
# Rollback to previous Docker image
docker pull your-registry/bankchase:previous-version
docker-compose -f docker-compose.yml run api

# Or restore from database backup
psql -U postgres -d bankchase < backup_previous.sql
```

### Zero-Downtime Updates

```bash
# Use blue-green deployment
docker-compose up -d api-blue  # New version
docker-compose stop api-green  # Old version
# Update load balancer to point to blue
```

---

## Support & Documentation

- API Documentation: http://localhost:8000/docs
- OpenAPI Schema: http://localhost:8000/openapi.json
- GitHub Issues: [repository-link]
- Security Issues: security@yourbank.com

---

## Checklist Before Going Live

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database backups configured
- [ ] Monitoring/alerts setup
- [ ] Documentation complete
- [ ] Runbooks created for support team
- [ ] Incident response plan ready
- [ ] Load testing completed
- [ ] Rate limiting verified
- [ ] PIN validation working
- [ ] Receipts generating correctly
- [ ] Webhooks delivering
- [ ] SSL/HTTPS configured
- [ ] Firewall rules set
- [ ] Admin user created
- [ ] Demo data seeded
- [ ] Health checks passing
