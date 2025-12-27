-- Delete the demo car that's blocking you
-- Run this in Supabase SQL Editor

-- First, let's see what cars exist
SELECT id, name, make, model, user_id, created_at 
FROM cars 
ORDER BY created_at;

-- Delete the demo car (replace the ID with your actual demo car ID if different)
-- The ID from your error: deac1af8-a94c-4ddd-a579-e8afa59e978a
DELETE FROM cars WHERE id = 'deac1af8-a94c-4ddd-a579-e8afa59e978a';

-- Or delete ALL cars for your user (if you want to start fresh)
-- Replace YOUR_USER_ID with your actual user ID from the error: 650d2ebe-ff77-4a16-b197-5902ca8ab37d
-- DELETE FROM cars WHERE user_id = '650d2ebe-ff77-4a16-b197-5902ca8ab37d';

-- Verify deletion
SELECT COUNT(*) as remaining_cars FROM cars;

