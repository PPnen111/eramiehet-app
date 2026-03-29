-- Add missing columns to bookings table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS location     text NOT NULL DEFAULT 'erakartano',
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS booker_name  text;

-- Remove defaults so future inserts must provide values explicitly
ALTER TABLE bookings
  ALTER COLUMN location DROP DEFAULT,
  ALTER COLUMN status   DROP DEFAULT;
