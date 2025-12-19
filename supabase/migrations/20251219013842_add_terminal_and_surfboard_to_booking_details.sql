ALTER TABLE booking_details
ADD COLUMN terminal text NULL,
ADD COLUMN is_surfboard boolean NOT NULL DEFAULT false;
