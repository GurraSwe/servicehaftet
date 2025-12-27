-- Comprehensive check for triggers, functions, and views
-- Run this to find what's causing cars to disappear

-- 1. Check for triggers on cars table
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'cars';

-- 2. Check for functions that might affect cars
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%cars%'
   OR routine_definition ILIKE '%car%'
   OR routine_name ILIKE '%car%';

-- 3. Check if cars is a view or table
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'cars';
-- Should be 'BASE TABLE', not 'VIEW'

-- 4. Check for views on cars
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_name = 'cars';

-- 5. Check for rules on cars table
SELECT 
    rulename,
    ev_type,
    definition
FROM pg_rules
WHERE tablename = 'cars';

-- 6. Check for any constraints that might auto-delete
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'cars'::regclass;

-- 7. Directly query the table (bypassing any views/rules)
SELECT COUNT(*) as direct_count FROM cars;

-- 8. Check the actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;

