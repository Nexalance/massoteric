# 🐳 Docker Setup for Massoteric

This project includes full Docker support for both development and production environments.

## 📁 Docker Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Production build (standalone output) |
| `Dockerfile.dev` | Development with hot reload |
| `docker-compose.yml` | Production deployment |
| `docker-compose.dev.yml` | Local development |
| `.dockerignore` | Files to exclude from Docker image |
| `.env.docker.example` | Environment variables template |

---

## 🚀 Quick Start

### Development (with Hot Reload)

```bash
# Copy environment file
cp .env.docker.example .env

# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop containers
docker-compose -f docker-compose.dev.yml down
```

The app will be available at `http://localhost:3000`

### Production

```bash
# Copy and configure environment
cp .env.docker.example .env
# Edit .env with your real Clerk/Stripe keys

# Build and start production containers
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

---

## 🔧 Environment Variables

Required variables for production:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Auto-set | PostgreSQL connection (Docker handles this) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook secret |
| `STRIPE_PRICE_STANDARD` | ✅ | Standard tier price ID |
| `STRIPE_PRICE_PRO` | ✅ | Pro tier price ID |

---

## 📦 Services

### PostgreSQL
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Data Volume:** `postgres_data` (production) / `postgres_dev_data` (dev)
- **Health Check:** Automatically checked before app starts

### Next.js App
- **Port:** 3000
- **Dependencies:** Waits for PostgreSQL to be healthy
- **Hot Reload:** Enabled in dev mode

---

## 🛠️ Common Commands

```bash
# Rebuild after code changes
docker-compose up -d --build

# Run database migrations
docker-compose exec app npx prisma db push

# Seed database
docker-compose exec app npm run db:seed

# Access container shell
docker-compose exec app sh

# View database
docker-compose exec postgres psql -U postgres -d massoteric

# Clean everything (including volumes)
docker-compose down -v
```

---

## 🌐 Deployment

### GitHub Actions + Docker

1. Push code to GitHub
2. GitHub Actions will build and push to registry
3. Deploy to your server

### Manual Deploy to Server

```bash
# On your server
git clone <your-repo>
cd <repo>
cp .env.docker.example .env
# Edit .env with production values
docker-compose up -d --build
```

---

## 🔍 Troubleshooting

### Port already in use
```bash
# Change port in .env
APP_PORT=3001
```

### Database connection issues
```bash
# Restart postgres container
docker-compose restart postgres

# Check postgres logs
docker-compose logs postgres
```

### Fresh start
```bash
# Stop and remove everything including volumes
docker-compose down -v

# Start fresh
docker-compose up -d --build
```
