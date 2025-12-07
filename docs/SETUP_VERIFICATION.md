# Local Development Setup Verification

Use this checklist to verify your local development environment is properly configured.

## ✅ Setup Verification Checklist

### Prerequisites

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should show v18.x.x or higher
  ```

- [ ] **pnpm** installed
  ```bash
  pnpm --version  # Should show version number
  ```

- [ ] **Docker** installed and running
  ```bash
  docker --version  # Should show version
  docker ps         # Should list running containers
  ```

- [ ] **Supabase CLI** installed
  ```bash
  supabase --version  # Should show version
  ```

### Environment Setup

- [ ] **Dependencies installed**
  ```bash
  # Should complete without errors
  pnpm install
  ```

- [ ] **Supabase started**
  ```bash
  supabase start
  # Should output API URL, keys, and service status
  ```

- [ ] **Environment file created**
  ```bash
  # File should exist
  ls .env.local
  ```

- [ ] **Environment variables configured**
  ```bash
  # Check these variables are set in .env.local:
  # - NEXT_PUBLIC_SUPABASE_URL
  # - NEXT_PUBLIC_SUPABASE_ANON_KEY
  # - SUPABASE_SERVICE_ROLE_KEY
  # - APP_BASE_URL
  # - NEXTAUTH_URL
  ```

### Service Verification

- [ ] **Supabase services running**
  ```bash
  supabase status
  # All services should show as "healthy"
  ```

- [ ] **Database accessible**
  - Open http://localhost:54323
  - Should see Supabase Studio interface
  - Can view tables: `bookings`, `daily_schedules`, `hotels`

- [ ] **Next.js development server running**
  ```bash
  pnpm dev
  # Should start on http://localhost:3000
  ```

- [ ] **Application accessible**
  - Open http://localhost:3000
  - Should see booking application homepage
  - No console errors in browser

### Edge Functions (Optional for Initial Setup)

- [ ] **Edge Functions directory structure exists**
  ```bash
  ls supabase/functions/_shared/
  # Should show: cors.ts, auth.ts, rate-limit.ts, errors.ts
  ```

- [ ] **Can serve Edge Functions locally** (if implemented)
  ```bash
  supabase functions serve booking --env-file .env.local
  # Should start function server
  ```

### Testing

- [ ] **Tests can run**
  ```bash
  pnpm test
  # Should execute tests without errors
  ```

- [ ] **Git security tests pass**
  ```bash
  pnpm test tests/git-security.test.ts
  # Should verify .gitignore configuration
  ```

## 🔍 Detailed Verification Steps

### 1. Verify Supabase Connection

```bash
# Check Supabase status
supabase status

# Expected output:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# All services: healthy
```

### 2. Verify Database Schema

Open Supabase Studio (http://localhost:54323) and check:

- [ ] Tables exist:
  - `bookings`
  - `daily_schedules`
  - `hotels`
  - `bus_schedules`
  - `admin_users`

- [ ] Views exist:
  - `booking_details`
  - `available_schedules`

- [ ] Functions exist:
  - `increment_capacity`
  - `create_booking_with_capacity`
  - `generate_daily_schedules`

### 3. Verify Environment Variables

```bash
# Check .env.local contains required variables
cat .env.local | grep -E "SUPABASE|APP_BASE|NEXTAUTH"

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# APP_BASE_URL=http://localhost:3000
# NEXTAUTH_URL=http://localhost:3000
```

### 4. Verify Application Routes

Test these URLs in your browser:

- [ ] http://localhost:3000 - Homepage
- [ ] http://localhost:3000/booking/ibis-style - Booking page
- [ ] http://localhost:3000/track - Tracking page
- [ ] http://localhost:3000/admin/login - Admin login
- [ ] http://localhost:54323 - Supabase Studio

### 5. Verify Git Configuration

```bash
# Check .gitignore excludes sensitive files
cat .gitignore | grep -E "functions|migrations|\.env"

# Should show:
# supabase/functions/**
# supabase/migrations/**
# .env*
```

### 6. Verify No Secrets in Repository

```bash
# Run security tests
pnpm test tests/git-security.test.ts

# Should pass all tests:
# ✓ gitignore excludes Edge Functions
# ✓ no migration files in git
# ✓ no secrets in tracked files
```

## 🐛 Troubleshooting

### Issue: Supabase won't start

**Symptoms**: `supabase start` fails or hangs

**Solutions**:
1. Check Docker is running: `docker ps`
2. Stop existing Supabase: `supabase stop`
3. Remove containers: `docker rm -f $(docker ps -aq)`
4. Try again: `supabase start`

### Issue: Port already in use

**Symptoms**: Error about port 54321, 54322, or 54323 in use

**Solutions**:
1. Stop Supabase: `supabase stop`
2. Check what's using the port: `netstat -ano | findstr :54321`
3. Kill the process or change Supabase ports in config

### Issue: Environment variables not loaded

**Symptoms**: Application can't connect to Supabase

**Solutions**:
1. Verify `.env.local` exists: `ls .env.local`
2. Check file contents: `cat .env.local`
3. Restart Next.js: Stop (Ctrl+C) and run `pnpm dev` again
4. Clear Next.js cache: `rm -rf .next`

### Issue: Database tables missing

**Symptoms**: Supabase Studio shows no tables

**Solutions**:
1. Reset database: `supabase db reset`
2. Check migrations: `supabase migration list`
3. Apply migrations manually if needed

### Issue: Tests failing

**Symptoms**: `pnpm test` shows failures

**Solutions**:
1. Check Node version: `node --version` (should be 18+)
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check test files exist: `ls tests/`

## 📊 Health Check Script

Create a file `scripts/health-check.sh` (or run these commands):

```bash
#!/bin/bash

echo "🔍 Checking local development environment..."
echo ""

# Check Node.js
echo "✓ Node.js version:"
node --version

# Check pnpm
echo "✓ pnpm version:"
pnpm --version

# Check Docker
echo "✓ Docker status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase || echo "No Supabase containers running"

# Check Supabase CLI
echo "✓ Supabase CLI version:"
supabase --version

# Check Supabase status
echo "✓ Supabase services:"
supabase status 2>/dev/null || echo "Supabase not started"

# Check environment file
echo "✓ Environment file:"
if [ -f .env.local ]; then
    echo ".env.local exists"
else
    echo "⚠️  .env.local missing - copy from .env.local.example"
fi

# Check Next.js
echo "✓ Next.js:"
if [ -d .next ]; then
    echo "Build directory exists"
else
    echo "Not built yet (run: pnpm dev)"
fi

echo ""
echo "✅ Health check complete!"
```

## 🎯 Quick Verification Commands

```bash
# One-liner to check everything
supabase status && \
curl -s http://localhost:54321/health && \
curl -s http://localhost:3000 > /dev/null && \
echo "✅ All services running!"

# Check database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT version();"

# Check API endpoint
curl http://localhost:54321/rest/v1/ -H "apikey: $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d'=' -f2)"
```

## 📝 Setup Completion Checklist

Once you've verified everything above, you're ready to develop! 

Final checklist:
- [ ] All prerequisites installed
- [ ] Supabase running and healthy
- [ ] Environment variables configured
- [ ] Application accessible at http://localhost:3000
- [ ] Database accessible at http://localhost:54323
- [ ] Tests passing
- [ ] Git security verified

## 🚀 Next Steps

1. **Read the documentation**:
   - [LOCAL_DEVELOPMENT_QUICKSTART.md](./LOCAL_DEVELOPMENT_QUICKSTART.md) - Quick start guide
   - [edge-functions-setup.md](./edge-functions-setup.md) - Edge Functions guide
   - [EDGE_FUNCTIONS_README.md](./EDGE_FUNCTIONS_README.md) - Architecture overview

2. **Explore the application**:
   - Test the booking flow
   - Access the admin dashboard
   - View database in Supabase Studio

3. **Start developing**:
   - Implement Edge Functions
   - Add new features
   - Write tests

---

**Need help?** Check the [troubleshooting section](#-troubleshooting) or see [edge-functions-setup.md](./edge-functions-setup.md) for detailed guidance.
