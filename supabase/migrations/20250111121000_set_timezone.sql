-- Set default timezone for all new connections --------------------------------
alter database postgres set timezone to 'Asia/Jakarta';

comment on database postgres is
  'Primary database; default timezone forced to Asia/Jakarta for consistent timestamps.';
