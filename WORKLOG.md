# Work Log

## 2024-12-02
- Set up design-system refactor across public pages (Plus Jakarta Sans, unified spacing/radius/shadow, mobile-first layout grids).
- Redesigned booking flow: two-column layout with sticky form, auto-scroll after schedule pick, English copy, country code + phone inputs, WhatsApp-active toggle.
- Improved ticket sending logic: background sends, skip WhatsApp when number marked inactive, clearer status labels and resend rules.
- Translated key public pages/components to English (booking page, confirmation, tracking, status cards, schedule selector, booking code).
- Noted remaining follow-ups: translate any lingering Indonesian strings in admin/API flows; enhance admin dashboard/ops console; ensure idempotency column added in DB for bookings.

## 2024-12-03
- ✅ Upgraded admin shell navigation and header (System Health nav, clearer page titles, admin key indicator).
- ✅ Modernized admin dashboard cards (English copy, 7-day booking trend sparkline, send-queue stats, WA failure counters).
- ✅ Added System Health page with send queue/WA failure visibility, overdue schedules, hot-route monitor, and recent admin audit logs.
- ✅ Translated admin bookings UI to English and clarified detail drawer.
- ✅ Added Send Queue page with filters and quick WA retry actions.
- ✅ Added auto-refresh, filter-synced refresh, and bulk retry on Send Queue.
- ✅ Added admin credential login (email/password) with signed session cookie and seeded default admin user.
- ✅ Added bus schedule CRUD with capacity safety guardrails and daily schedule inventory badges.

## Admin Upgrade Backlog
- Central Dashboard: Real-time KPIs (new bookings, send queue, failures, revenue, seats left per route/hotel), with trend sparklines and alerts.
- Booking Ops Console: Search by code/name/phone/date/hotel; timeline (create → payment → ticket send attempts); status changes (confirm/cancel/refund); resend via WhatsApp/SMS/email; mark number inactive/active; edit passenger details with audit.
- ✅ Send Queue & Recovery: Visible message queue with retries/backoff; filters for failed/pending/sent; bulk retry; per-attempt error logs; skip WhatsApp when marked inactive; alternate channel override.
- Idempotency & Spam Guard: Enforce idempotency keys; rate-limit per user/IP; atomic seat locks; duplicate detection/merge; abandoned-cart cleanup job.
- Seat & Schedule Management: CRUD buses/schedules/hotels; capacity changes with safety checks; block dates; fare overrides/promos; inventory view (sold/held/available). (Partially done: bus schedule CRUD + safety + inventory; block dates/fare overrides pending.)
- User & Role Management: Roles (Admin, Ops, Support, Finance); granular permissions; SSO-ready; session audit trail.
- Audit & Logs: Immutable audit log per entity; admin actions tracked (who/when/what changed); anomaly flags on risky actions.
- Alerts & Notifications: Slack/Email alerts for send-failure spikes, payment mismatches, low capacity, high error rate; weekly ops digest.
- Analytics & Reports: Booking funnel, conversion, channel performance; cancellation reasons; NPS/CSAT post-trip; cohort retention for return riders.
- Customer Support Tools: One-click share ticket link; regenerate PDFs; quick status badges; “view as” mode with sensitive-data redaction.
- Compliance & Safety: PII access rules; export/delete request handling; masked phone display except with permission; rate limits on exports.
- System Health: Admin view of background job health, cron status, and recent errors; manual restart/trigger; feature flag toggles.
