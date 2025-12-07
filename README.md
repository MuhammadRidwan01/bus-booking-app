# Shuttle Bus Booking System

A hotel shuttle bus booking system for Ibis Jakarta Airport hotels (Ibis Style and Ibis Budget). This application provides a streamlined booking flow for guests to reserve seats on airport shuttle buses with real-time capacity tracking.

## 🚀 Features

- **Real-time shuttle booking** with live capacity tracking
- **Hotel selection** between Ibis Style and Ibis Budget Jakarta Airport
- **Schedule selection** with visual capacity indicators
- **WhatsApp ticket delivery** using Wablas API integration
- **Booking tracking** via unique booking codes
- **Admin dashboard** for managing bookings and schedules
- **Secure Edge Functions** for protected business logic

## 🏗️ Architecture

This application uses a secure architecture with Supabase Edge Functions to protect business logic:

```
Frontend (Next.js) → Edge Functions (Supabase) → Database (PostgreSQL + RLS)
```

**Security Features:**
- Edge Functions keep business logic private (not in repository)
- Service role keys secured in Supabase secrets
- Row Level Security (RLS) on all database tables
- JWT authentication for all API calls
- Rate limiting on all endpoints

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **pnpm**
- **Docker** (for local Supabase)
- **Supabase CLI** - Install via:
  ```bash
  npm install -g supabase
  ```
- **Git** for version control

## 🛠️ Local Development Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd bus-booking-app

# Install dependencies
pnpm install
```

### Step 2: Start Local Supabase

```bash
# Start local Supabase instance (includes PostgreSQL, Auth, Storage)
supabase start

# This will output local credentials:
# - API URL: http://localhost:54321
# - Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Save these credentials for the next step!

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your local Supabase credentials
# Use the keys from the `supabase start` output above
```

Example `.env.local` configuration:

```bash
# Local Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# App configuration
APP_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=local-dev-secret

# WhatsApp (use test credentials or leave as-is for development)
WABLAS_BASE_URL=https://bdg.wablas.com
WABLAS_TOKEN=your-test-token
WABLAS_SECRET_KEY=your-test-secret
```

### Step 4: Create Edge Functions (Local Only)

Edge Functions are **not committed to the repository** for security reasons. You need to create them locally:

```bash
# The directory structure is already set up, but functions need to be implemented
# See docs/edge-functions-setup.md for detailed implementation examples

# Example: Create booking function
mkdir -p supabase/functions/booking
# Then create supabase/functions/booking/index.ts with your implementation
```

**Note**: See [docs/edge-functions-setup.md](./docs/edge-functions-setup.md) for complete Edge Function implementation examples.

### Step 5: Serve Edge Functions Locally

```bash
# In a separate terminal, serve Edge Functions
supabase functions serve booking --env-file .env.local

# This makes functions available at:
# http://localhost:54321/functions/v1/booking
```

### Step 6: Start the Development Server

```bash
# In another terminal, start Next.js
pnpm dev

# Application will be available at:
# http://localhost:3000
```

### Step 7: Access Supabase Studio

```bash
# Open Supabase Studio (database UI) in your browser
# http://localhost:54323

# Here you can:
# - View and edit database tables
# - Manage authentication
# - View logs
# - Test SQL queries
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🔐 Edge Functions

Edge Functions are serverless functions that run on Supabase infrastructure, keeping business logic and service role keys secure.

### Why Edge Functions?

- **Security**: Business logic stays on Supabase servers (not in repository)
- **Privacy**: Function code is never committed to git
- **Scalability**: Auto-scaling serverless infrastructure
- **Protection**: Service role keys never exposed to clients

### Local Development

```bash
# Create Edge Functions locally (not tracked by git)
mkdir -p supabase/functions/booking
# Implement your function in index.ts

# Serve locally for testing
supabase functions serve booking --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/booking \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test",...}'
```

### Production Deployment

```bash
# Set secrets first
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."

# Deploy function (from local files, not git)
supabase functions deploy booking

# Verify deployment
curl https://<project-ref>.functions.supabase.co/booking
```

**⚠️ WARNING**: Edge Functions are in `.gitignore` and should NEVER be committed to the repository. They contain sensitive business logic that must remain private.

## 📚 Documentation

- **[Edge Functions Setup Guide](./docs/edge-functions-setup.md)** - Complete guide for Edge Functions development and deployment
- **[Edge Functions README](./docs/EDGE_FUNCTIONS_README.md)** - Security information and architecture overview
- **[Local Development Quickstart](./docs/LOCAL_DEVELOPMENT_QUICKSTART.md)** - Quick setup guide
- **[Bus Booking Context](./docs/bus-booking-context.md)** - Business context and requirements

## 🔒 Security

### ⚠️ IMPORTANT: Do NOT Commit Edge Functions or Migrations

**This repository intentionally excludes:**
- ✋ **Edge Functions** (`supabase/functions/**`) - Business logic must stay private
- ✋ **Database Migrations** (`supabase/migrations/**`) - Schema must not be exposed
- ✋ **Secrets** (`.env*` files) - All credentials managed via Supabase CLI

**Why?** These files contain sensitive business logic and database structure that could be used to reverse-engineer the system. They are protected via `.gitignore` and should NEVER be committed.

### Security Layers

This application implements multiple security layers:

1. **Repository Security**
   - Edge Functions not committed (business logic protected)
   - Database migrations not committed (schema protected)
   - No secrets in repository (all in Supabase secrets)
   - Minimal type definitions (no schema exposure)
   - Restrictive license (All Rights Reserved)

2. **Runtime Security**
   - JWT authentication on all endpoints
   - Rate limiting (10-30 requests/minute per IP)
   - Row Level Security (RLS) on all database tables
   - Generic error messages (no internal details exposed)
   - Service role keys only in Edge Functions (never client-side)
   - Input validation with Zod schemas

3. **Build Security**
   - Minified production builds
   - No source maps in production
   - Environment variables for all endpoints
   - Obfuscated JavaScript code

### Secret Management

All sensitive credentials are managed via Supabase CLI secrets:

```bash
# Set secrets (NEVER commit these)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
supabase secrets set WABLAS_TOKEN="..."
supabase secrets set WABLAS_SECRET_KEY="..."
supabase secrets set APP_BASE_URL="..."

# List secrets (values are encrypted)
supabase secrets list
```

See [docs/edge-functions-setup.md](./docs/edge-functions-setup.md) for complete secret management guide.

## 🚀 Production Deployment

### Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref <your-project-ref>

# Set production secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-key>"
supabase secrets set WABLAS_TOKEN="<your-token>"
supabase secrets set WABLAS_SECRET_KEY="<your-secret>"
supabase secrets set APP_BASE_URL="https://your-domain.com"

# Deploy Edge Functions
supabase functions deploy booking
supabase functions deploy admin-booking
supabase functions deploy booking-status
```

### Deploy Frontend (Vercel)

```bash
# Push to GitHub (only UI code, no functions)
git push origin main

# Configure environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_BOOKING_FUNCTION_URL
# - NEXT_PUBLIC_ADMIN_BOOKING_FUNCTION_URL
# - NEXT_PUBLIC_BOOKING_STATUS_FUNCTION_URL

# Vercel will auto-deploy from GitHub
```

See [docs/edge-functions-setup.md](./docs/edge-functions-setup.md) for detailed deployment instructions.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript 5 with strict mode
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: react-hook-form + Zod validation
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 📁 Project Structure

```
app/                    # Next.js App Router pages and API routes
├── actions/           # Server actions for mutations
├── admin/             # Admin dashboard pages
├── api/               # API route handlers
├── booking/           # Public booking flow pages
└── track/             # Booking tracking page

components/            # React components
├── admin/            # Admin-specific components
└── ui/               # shadcn/ui component library

lib/                   # Shared utilities and configurations
├── supabase-*.ts     # Supabase client variants
├── validations.ts    # Zod schemas
└── utils.ts          # General utilities

supabase/             # Supabase configuration
├── functions/        # Edge Functions (NOT committed)
│   ├── _shared/     # Shared utilities (committed)
│   ├── booking/     # Booking function (local only)
│   ├── admin-booking/ # Admin function (local only)
│   └── booking-status/ # Status function (local only)
└── migrations/       # Database migrations (NOT committed)

docs/                 # Documentation
tests/                # Test files
types/                # TypeScript type definitions
```

## 🔧 Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Supabase
supabase start        # Start local Supabase
supabase stop         # Stop local Supabase
supabase status       # Check status
supabase db reset     # Reset local DB with migrations

# Edge Functions
supabase functions serve <name>    # Serve function locally
supabase functions deploy <name>   # Deploy to production
supabase secrets set KEY="value"   # Set secret

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

## 🐛 Troubleshooting

### "Command not found: supabase"
Install Supabase CLI: `npm install -g supabase`

### "Failed to start local Supabase"
Ensure Docker is running: `docker ps`

### "Edge Function not found"
Create the function locally in `supabase/functions/<name>/index.ts`

### CORS errors in browser
Ensure CORS headers are included in Edge Function responses

See [docs/edge-functions-setup.md](./docs/edge-functions-setup.md) for more troubleshooting tips.

## 📄 License

All Rights Reserved. See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

This is a private project. Edge Functions and database migrations are intentionally not included in the repository for security reasons.

## 📞 Support

For issues or questions:
1. Check the [Edge Functions Setup Guide](./docs/edge-functions-setup.md)
2. Review [Supabase Documentation](https://supabase.com/docs)
3. Check Supabase Dashboard logs for errors

---

**Important**: This repository contains only the frontend UI code. Edge Functions and database migrations are kept private for security. See documentation for setup instructions.
