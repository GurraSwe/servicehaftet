-- Direct query test - bypass everything
-- Run this to see if cars actually exist in the database

-- Query directly from the table
SELECT * FROM cars;

-- Count directly
SELECT COUNT(*) as total_cars FROM cars;

-- If you see cars here but not in the app, there's a trigger/view/RLS issue

-- Also check recent inserts
SELECT 
    id,
    name,
    make,
    model,
    user_id,
    created_at
FROM cars
ORDER BY created_at DESC
LIMIT 10;

-- Check if there's a pattern (like demo cars being created automatically)
SELECT 
    name,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM cars
GROUP BY name
ORDER BY count DESC;

