-- Prevent demo cars from being created
-- This removes any triggers or functions that might be creating demo cars

-- Check for triggers that might create demo cars
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cars';

-- Check for functions that might create demo cars
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%demo%' 
   OR routine_name LIKE '%seed%'
   OR routine_name LIKE '%car%';

-- If you find any triggers or functions creating demo cars, drop them:
-- DROP TRIGGER IF EXISTS trigger_name ON cars;
-- DROP FUNCTION IF EXISTS function_name();

-- Also check if there's a default value or constraint creating demo cars
SELECT 
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'cars';

