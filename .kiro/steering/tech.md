# Tech Stack

## Framework & Runtime

- **Next.js 15** with App Router (React 19)
- **TypeScript 5** with strict mode enabled
- **Node.js** runtime

## Database & Backend

- **Supabase** for PostgreSQL database, real-time subscriptions, and auth
- **Server Actions** for form submissions and mutations
- **API Routes** for webhooks and cron jobs
- **RPC Functions** for atomic database operations (capacity management, booking creation)

## UI & Styling

- **Tailwind CSS** for styling with CSS variables for theming
- **shadcn/ui** component library built on Radix UI primitives
- **Lucide React** for icons
- **next-themes** for dark mode support

## Key Libraries

- **react-hook-form** + **zod** for form validation
- **date-fns** for date manipulation
- **qrcode** + **pdf-lib** for ticket generation
- **puppeteer** for PDF rendering
- **node-cron** for scheduled tasks
- **Twilio** (configured but WhatsApp via Wablas)

## Package Manager

- **pnpm** (lockfile present)

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on localhost:3000

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# Database (Supabase CLI)
supabase start        # Start local Supabase
supabase db reset     # Reset local DB with migrations
supabase migration new <name>  # Create new migration
```

## Environment Variables

Required variables in `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Admin operations

# WhatsApp (Wablas)
WABLAS_API_KEY=
WABLAS_TEMPLATE_ID=

# Cron Jobs
CRON_SECRET=                   # Auth for cron endpoints
NEXTAUTH_URL=                  # Base URL for internal API calls
```

## Build Configuration

- **Path aliases**: `@/*` maps to project root
- **Image optimization**: Disabled (unoptimized: true)
- **Target**: ES6
- **Module resolution**: bundler
