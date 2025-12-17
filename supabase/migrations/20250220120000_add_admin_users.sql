create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  salt text not null,
  role text not null default 'admin',
  is_active boolean not null default true,
  last_login_at timestamptz
);

insert into public.admin_users (email, password_hash, salt, role, is_active)
values (
  'admin@shuttle.test',
  '0f1b5c0be769a9497e2116d618aff5ee965e122b1b7c9dbf679857fe7ab4bdf6e84cd8b8a7cefe51a8decb089ae5aa950c2fcfba92353a560cc3b310f0a604f0',
  '1e6d26a40da84e12c7edadf557b90fd3',
  'admin',
  true
)
on conflict (email) do nothing;
