-- Check if RLS is actually disabled
-- Run this to verify RLS status

SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'cars';

-- Should show: rowsecurity = false (if RLS is disabled)
-- If it shows true, RLS is still enabled!

-- Check all cars (should work if RLS is disabled)
SELECT id, name, user_id, created_at FROM cars ORDER BY created_at DESC;

-- Check for triggers that might delete cars
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cars';

