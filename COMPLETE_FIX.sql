-- COMPLETE FIX: Remove all policies and ensure RLS is disabled
-- Run this entire script in Supabase SQL Editor

-- Step 1: Disable RLS first
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (they might be blocking even with RLS disabled)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on cars
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'cars') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON cars';
    END LOOP;
    
    -- Drop all policies on service_logs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON service_logs';
    END LOOP;
    
    -- Drop all policies on service_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON service_items';
    END LOOP;
    
    -- Drop all policies on reminders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reminders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reminders';
    END LOOP;
END $$;

-- Step 3: Verify no policies remain
SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');
-- Should return 0 rows

-- Step 4: Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');
-- All should show: rowsecurity = false

-- Step 5: Test query (should work now)
SELECT COUNT(*) as total_cars FROM cars;
SELECT * FROM cars LIMIT 5;

-- If you see cars here, RLS/policies are fixed!

