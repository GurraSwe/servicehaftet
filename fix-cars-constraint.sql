-- Complete fix for the cars table and related constraints
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing unique constraint/index if it exists
DO $$ 
BEGIN
    -- Try to drop as a constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cars_user_plate_unique'
    ) THEN
        ALTER TABLE cars DROP CONSTRAINT cars_user_plate_unique;
    END IF;
    
    -- Try to drop as an index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'cars_user_plate_unique'
    ) THEN
        DROP INDEX IF EXISTS cars_user_plate_unique;
    END IF;
END $$;

-- Step 2: Clean up any existing cars with empty string license_plates (convert to NULL)
UPDATE cars SET license_plate = NULL WHERE license_plate = '';
UPDATE cars SET vin = NULL WHERE vin = '';
UPDATE cars SET notes = NULL WHERE notes = '';

-- Step 3: Recreate the constraint as a partial unique index (allows multiple NULLs)
-- This ensures users can have multiple cars without license plates, but not duplicate plates
CREATE UNIQUE INDEX IF NOT EXISTS cars_user_plate_unique 
ON cars(user_id, license_plate) 
WHERE license_plate IS NOT NULL;

-- Step 4: Verify the table structure
-- This will show you the current structure of the cars table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;

-- Note: The id column should be 'integer' type (from SERIAL)
-- If you see any issues, the table might need to be recreated
