# Local Development Quick Start

This is a condensed guide to get you up and running quickly. For detailed information, see [edge-functions-setup.md](./edge-functions-setup.md).

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Docker installed and running
- [ ] Supabase CLI installed (`npm install -g supabase`)

## Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Supabase

```bash
supabase start
```

**Save the output!** You'll need:
- `API URL`: http://localhost:54321
- `anon key`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `service_role key`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 3. Configure Environment

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local and paste the keys from step 2
```

Minimum required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
APP_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=local-dev-secret
```

### 4. Create Edge Functions (Optional for Initial Testing)

Edge Functions are needed for booking operations. Create them locally:

```bash
# Create booking function directory
mkdir -p supabase/functions/booking

# Create the function file
# See docs/edge-functions-setup.md for implementation examples
```

**Note**: You can skip this initially and use the Next.js Server Actions for testing.

### 5. Start Development Server

```bash
# Terminal 1: Start Next.js
pnpm dev

# Terminal 2 (optional): Serve Edge Functions
supabase functions serve booking --env-file .env.local
```

## Access Points

- **Application**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (database UI)
- **Edge Functions**: http://localhost:54321/functions/v1/

## Verify Setup

### Check Supabase is Running

```bash
supabase status
```

Should show all services as "healthy".

### Check Database Connection

Open http://localhost:54323 in your browser. You should see the Supabase Studio interface.

### Check Application

Open http://localhost:3000. You should see the booking application homepage.

## Common Issues

### Docker not running
```bash
# Check Docker status
docker ps

# If not running, start Docker Desktop
```

### Port already in use
```bash
# Stop Supabase
supabase stop

# Start again
supabase start
```

### Environment variables not loaded
```bash
# Restart Next.js dev server
# Press Ctrl+C and run: pnpm dev
```

## Next Steps

1. **Explore the Database**: Open http://localhost:54323
   - View tables: `bookings`, `daily_schedules`, `hotels`
   - Check seed data
   - Run SQL queries

2. **Test Booking Flow**:
   - Go to http://localhost:3000
   - Select a hotel
   - Choose a schedule
   - Fill in booking details
   - Submit (will use Server Actions if Edge Functions not set up)

3. **Implement Edge Functions**:
   - See [edge-functions-setup.md](./edge-functions-setup.md)
   - Copy example implementations
   - Test locally before deploying

4. **Access Admin Dashboard**:
   - Go to http://localhost:3000/admin/login
   - Use admin credentials (check seed data)

## Development Workflow

```bash
# Daily workflow
supabase start              # Start Supabase (if not running)
pnpm dev                    # Start Next.js

# When working on Edge Functions
supabase functions serve <name> --env-file .env.local

# When done
supabase stop               # Stop Supabase (optional)
```

## Testing

```bash
# Run tests
pnpm test

# Run specific test file
pnpm test tests/git-security.test.ts
```

## Useful Commands

```bash
# Supabase
supabase status             # Check status
supabase db reset           # Reset database (careful!)
supabase db diff            # Show schema changes
supabase migration list     # List migrations

# Database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Logs
supabase logs               # View all logs
```

## Getting Help

1. **Documentation**:
   - [Edge Functions Setup](./edge-functions-setup.md) - Detailed guide
   - [Edge Functions README](./EDGE_FUNCTIONS_README.md) - Architecture overview
   - [Main README](../README.md) - Project overview

2. **Supabase Resources**:
   - [Supabase Docs](https://supabase.com/docs)
   - [Edge Functions Guide](https://supabase.com/docs/guides/functions)
   - [Local Development](https://supabase.com/docs/guides/cli/local-development)

3. **Troubleshooting**:
   - Check [edge-functions-setup.md](./edge-functions-setup.md#troubleshooting)
   - View Supabase logs: `supabase logs`
   - Check Docker: `docker ps`

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | `eyJhbGci...` |
| `APP_BASE_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_URL` | Auth callback URL | `http://localhost:3000` |
| `CRON_SECRET` | Cron job auth | `local-dev-secret` |
| `WABLAS_TOKEN` | WhatsApp API token | (optional for local) |
| `WABLAS_SECRET_KEY` | WhatsApp API secret | (optional for local) |

## Quick Reference Card

```bash
# Setup (once)
pnpm install
supabase start
cp .env.local.example .env.local
# Edit .env.local with Supabase keys

# Daily Development
supabase start              # If not running
pnpm dev                    # Start app

# Edge Functions
supabase functions serve <name> --env-file .env.local

# Testing
pnpm test

# Cleanup
supabase stop
```

---

**Ready to start?** Run `supabase start` and `pnpm dev` to begin developing!
