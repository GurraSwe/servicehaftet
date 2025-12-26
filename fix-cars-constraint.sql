-- Run this SQL in your Supabase SQL Editor to fix the license_plate unique constraint
-- This makes the constraint allow NULL values (multiple NULLs don't violate unique constraints)

-- Step 1: Drop the existing constraint/index if it exists (try both methods)
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

-- Step 3: Recreate the constraint as a partial unique index (allows multiple NULLs)
-- This ensures users can have multiple cars without license plates, but not duplicate plates
CREATE UNIQUE INDEX cars_user_plate_unique 
ON cars(user_id, license_plate) 
WHERE license_plate IS NOT NULL;

-- Note: This creates a partial unique index that only applies when license_plate is NOT NULL
-- Multiple NULL values are allowed (since they're excluded from the index)

