-- Add phone column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS phone TEXT;
