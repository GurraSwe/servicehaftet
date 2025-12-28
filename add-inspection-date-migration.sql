-- Migration: Add last_inspection_date to cars table
-- This replaces the service interval fields with inspection-based reminders
-- Run this in Supabase SQL Editor

-- Step 1: Add last_inspection_date column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS last_inspection_date DATE;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cars_last_inspection_date ON cars(last_inspection_date);

-- Step 3: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cars' 
AND column_name = 'last_inspection_date';

-- Note: We keep service_interval_months and service_interval_kilometers columns
-- for now to avoid breaking existing data. They can be removed later if needed.

