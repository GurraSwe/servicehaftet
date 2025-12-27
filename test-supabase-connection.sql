-- Test if cars table is accessible
-- Run this in Supabase SQL Editor

-- Check if table exists and is accessible
SELECT COUNT(*) as total FROM cars;

-- Check recent cars
SELECT id, name, user_id, created_at 
FROM cars 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there's a view masking the table
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'cars';
-- Should show 'BASE TABLE'

-- Check table owner and schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'cars';

