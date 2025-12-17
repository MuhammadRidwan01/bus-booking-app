ALTER TABLE bookings
ADD COLUMN terminal text NULL,
ADD COLUMN is_surfboard boolean NOT NULL DEFAULT false;