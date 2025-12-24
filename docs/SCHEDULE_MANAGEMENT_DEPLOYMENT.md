# Schedule Management System - Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the Schedule Management System, which transforms the single-service shuttle booking system into a dual-service system supporting both drop-off (hotel-to-airport) and pick-up (airport-to-hotel) services.

## Pre-Deployment Checklist

### Database Migrations
- [x] Schedule management schema migration (`20251221000000_schedule_management_schema.sql`)
- [x] Initial schedule data seeding (`20251221000001_seed_schedule_data.sql`)
- [x] Functions and views updates (`20251221000002_update_functions_and_views.sql`)

### Code Components
- [x] Service type selection component (`ServiceTypeSelector.tsx`)
- [x] Terminal selection component (`TerminalSelector.tsx`)
- [x] Updated booking actions with service type support
- [x] Real-time capacity hook with service filtering
- [x] Admin interface enhancements
- [x] WhatsApp message template updates
- [x] PDF ticket generation updates

### Testing
- [x] Integration tests for booking flows
- [x] Performance tests for dual service schedules
- [x] Admin interface functionality tests
- [x] Real-time capacity management tests

## Deployment Steps

### 1. Database Migration

```bash
# Apply migrations in order
supabase db push

# Verify migrations applied successfully
supabase db diff --schema public
```

### 2. Environment Variables

Ensure the following environment variables are configured:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp Integration
WABLAS_API_KEY=your-wablas-key
WABLAS_TEMPLATE_ID=your-template-id

# Security
CRON_SECRET=your-cron-secret
NEXTAUTH_URL=https://your-domain.com
```

### 3. Edge Functions Deployment

```bash
# Deploy updated booking edge function
supabase functions deploy booking

# Deploy updated admin booking edge function
supabase functions deploy admin-booking

# Deploy updated booking status edge function
supabase functions deploy booking-status
```

### 4. Frontend Application Deployment

```bash
# Build the application
pnpm build

# Deploy to your hosting platform (Vercel, Netlify, etc.)
# Follow your platform-specific deployment process
```

### 5. Post-Deployment Verification

#### Database Verification
```sql
-- Verify schedule templates exist
SELECT * FROM schedule_templates WHERE is_active = true;

-- Verify daily schedules are generated
SELECT COUNT(*) FROM daily_schedules WHERE schedule_date >= CURRENT_DATE;

-- Verify terminal meeting points
SELECT * FROM terminal_meeting_points ORDER BY terminal_code;

-- Verify booking details view includes new fields
SELECT * FROM booking_details LIMIT 1;
```

#### API Endpoint Testing
```bash
# Test booking endpoint with service type
curl -X POST "https://your-project.supabase.co/functions/v1/booking" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "phoneNumber": "081234567890",
    "serviceType": "drop_off",
    "scheduleId": "test-schedule-id",
    "passengerCount": 1,
    "hasWhatsapp": "yes",
    "countryCode": "62",
    "idempotencyKey": "test-key"
  }'

# Test booking status endpoint
curl "https://your-project.supabase.co/functions/v1/booking-status?code=IBX12345678" \
  -H "Authorization: Bearer your-anon-key"
```

#### Frontend Testing
- [ ] Test service type selection on booking page
- [ ] Test drop-off booking flow (hotel to airport)
- [ ] Test pick-up booking flow with terminal selection
- [ ] Test admin interface with dual service schedules
- [ ] Test real-time capacity updates
- [ ] Test WhatsApp message delivery with service info
- [ ] Test PDF ticket generation with meeting point details

## Performance Monitoring

### Key Metrics to Monitor

1. **Database Performance**
   - Query response times for schedule filtering
   - Real-time capacity update latency
   - Admin interface query performance

2. **API Performance**
   - Booking endpoint response times
   - Edge function execution times
   - WhatsApp integration success rates

3. **User Experience**
   - Page load times for booking flow
   - Real-time update responsiveness
   - Mobile performance metrics

### Monitoring Queries

```sql
-- Monitor booking distribution by service type
SELECT 
  service_type,
  COUNT(*) as booking_count,
  AVG(EXTRACT(EPOCH FROM (created_at - created_at))) as avg_processing_time
FROM bookings 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY service_type;

-- Monitor schedule utilization
SELECT 
  service_type,
  departure_time,
  AVG(current_bookings::float / capacity * 100) as avg_utilization
FROM daily_schedules 
WHERE schedule_date >= CURRENT_DATE
GROUP BY service_type, departure_time
ORDER BY service_type, departure_time;

-- Monitor terminal selection patterns
SELECT 
  terminal_code,
  COUNT(*) as selection_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM bookings 
WHERE service_type = 'pick_up' 
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY terminal_code
ORDER BY selection_count DESC;
```

## Rollback Procedures

### Database Rollback
```bash
# If issues occur, rollback migrations
supabase db reset --db-url "your-db-url"

# Or apply specific rollback migration
supabase migration new rollback_schedule_management
```

### Application Rollback
```bash
# Revert to previous deployment
# Follow your platform-specific rollback process

# For Vercel:
vercel rollback

# For manual deployment:
git revert <commit-hash>
pnpm build
# Redeploy
```

### Edge Functions Rollback
```bash
# Deploy previous version of edge functions
git checkout <previous-commit>
supabase functions deploy booking
supabase functions deploy admin-booking
supabase functions deploy booking-status
```

## Troubleshooting

### Common Issues

1. **Service Type Not Recognized**
   - Verify `service_type` field exists in `daily_schedules` table
   - Check that booking validation includes service type

2. **Terminal Selection Not Working**
   - Verify `terminal_meeting_points` table is populated
   - Check that pick-up bookings include terminal validation

3. **Real-time Updates Not Working**
   - Verify Supabase real-time is enabled
   - Check that service type filtering is applied correctly

4. **Admin Interface Issues**
   - Verify admin authentication is working
   - Check that schedule template queries include service type

### Debug Queries

```sql
-- Check schedule data integrity
SELECT 
  service_type,
  COUNT(*) as schedule_count,
  MIN(departure_time) as earliest_time,
  MAX(departure_time) as latest_time
FROM daily_schedules 
WHERE schedule_date = CURRENT_DATE
GROUP BY service_type;

-- Check booking data integrity
SELECT 
  service_type,
  COUNT(*) as booking_count,
  COUNT(terminal_code) as with_terminal,
  COUNT(meeting_point_id) as with_meeting_point
FROM bookings 
WHERE created_at >= CURRENT_DATE
GROUP BY service_type;

-- Check for orphaned data
SELECT COUNT(*) FROM bookings 
WHERE service_type = 'pick_up' 
  AND (terminal_code IS NULL OR meeting_point_id IS NULL);
```

## Success Criteria

The deployment is considered successful when:

- [ ] All database migrations applied without errors
- [ ] Both service types (drop-off and pick-up) are available for booking
- [ ] Terminal selection works for pick-up bookings
- [ ] Real-time capacity updates work for both service types
- [ ] Admin interface displays dual service schedules correctly
- [ ] WhatsApp messages include service type and terminal information
- [ ] PDF tickets show meeting point details for pick-up bookings
- [ ] Performance metrics meet established benchmarks
- [ ] No critical errors in application logs

## Support Contacts

- **Database Issues**: Database Administrator
- **Application Issues**: Development Team
- **Infrastructure Issues**: DevOps Team
- **Business Logic Issues**: Product Team

## Documentation Updates

After successful deployment, update the following documentation:

- [ ] User guide for new booking flow
- [ ] Admin manual for schedule management
- [ ] API documentation with service type parameters
- [ ] Customer support scripts for dual services
- [ ] Monitoring and alerting runbooks