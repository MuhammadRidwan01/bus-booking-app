-- Add idempotency key to guard against double submissions
alter table public.bookings
  add column if not exists idempotency_key text;

-- Enforce uniqueness only when the key is present (existing rows may stay null)
create unique index if not exists bookings_idempotency_key_idx
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

comment on column public.bookings.idempotency_key is 'Client-supplied key to make booking creation idempotent';
