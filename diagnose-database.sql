-- Diagnostic script to check database state
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if cars table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;

-- 2. Check all existing cars (to see if they're being created)
SELECT id, user_id, name, make, model, year, license_plate, created_at
FROM cars
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check RLS policies on cars table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'cars';

-- 4. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'cars';

-- 5. Check for any constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE con.contype::text
    END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'cars';

-- 6. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'cars';
