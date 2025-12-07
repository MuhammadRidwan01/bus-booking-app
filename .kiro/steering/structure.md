# Project Structure

## Directory Organization

```
app/                    # Next.js App Router pages and API routes
├── actions/           # Server actions for mutations
├── admin/             # Admin dashboard pages (protected)
├── api/               # API route handlers
├── booking/           # Public booking flow pages
└── track/             # Booking tracking page

components/            # React components
├── admin/            # Admin-specific components
└── ui/               # shadcn/ui component library

lib/                   # Shared utilities and configurations
├── supabase-*.ts     # Supabase client variants (browser/server/admin)
├── validations.ts    # Zod schemas
├── whatsapp.ts       # WhatsApp integration
└── utils.ts          # General utilities

hooks/                 # Custom React hooks
types/                 # TypeScript type definitions
supabase/             # Database migrations and config
├── migrations/       # SQL migration files
└── seed.sql          # Seed data

public/               # Static assets (images, logos)
styles/               # Global CSS
```

## Key Conventions

### File Naming

- **Pages**: `page.tsx` (App Router convention)
- **Client components**: `ComponentName.tsx` or `ComponentNameClient.tsx`
- **Server actions**: `actions.ts` in relevant directories
- **API routes**: `route.ts` in `app/api/[endpoint]/`
- **Types**: `index.ts` in `types/` directory

### Component Patterns

- **Server Components by default** (Next.js 15 App Router)
- **Client Components** marked with `'use client'` directive
- **Server Actions** for form submissions and data mutations
- **API Routes** for external webhooks and cron jobs

### Supabase Client Usage

- `lib/supabase-browser.ts` - Client-side operations (public data)
- `lib/supabase-server.ts` - Server-side operations (SSR, Server Components)
- `lib/supabase-admin.ts` - Admin operations (service role key)
- `lib/supabase-config.ts` - Centralized configuration

### Database Patterns

- **Migrations** in `supabase/migrations/` with timestamp prefix
- **Views** for complex queries (`booking_details`, `available_schedules`)
- **RPC functions** for atomic operations (`increment_capacity`, `create_booking_with_capacity`)
- **Triggers** for automatic status updates (`sync_daily_schedule_status`)
- **Real-time subscriptions** for live capacity updates

### Admin Routes

All admin pages are under `/admin/*` and use:
- Cookie-based authentication (`admin_key`)
- Shared layout in `app/admin/layout.tsx`
- Admin shell component for consistent navigation

### API Route Patterns

- **Cron endpoints**: `/api/cron/*` with `Authorization: Bearer <CRON_SECRET>`
- **Public endpoints**: `/api/booking-status`, `/api/ticket/[code]`
- **Admin endpoints**: `/api/admin/*` with authentication

### Form Validation

- **Zod schemas** defined in `lib/validations.ts`
- **react-hook-form** with `@hookform/resolvers/zod`
- **Server-side validation** in server actions

### Styling Conventions

- **Tailwind utility classes** for styling
- **CSS variables** for theming (defined in `app/globals.css`)
- **shadcn/ui components** for consistent UI
- **Responsive design** with mobile-first approach
- **Design tokens**: rounded-2xl for cards, shadow-md for elevation

### Type Safety

- **Strict TypeScript** enabled
- **Shared types** in `types/index.ts`
- **Database types** match Supabase schema
- **Zod schemas** for runtime validation
