-- FINAL FIX: Completely remove RLS and all policies
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Drop ALL policies on cars table (using DO block to catch all)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Get all policy names and drop them
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cars'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON cars', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Disable RLS
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify no policies remain
SELECT 
    'Remaining policies:' as check_type,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'cars';
-- Should show: 0

-- Step 4: Verify RLS is disabled
SELECT 
    'RLS Status:' as check_type,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'cars';
-- Should show: rowsecurity = false

-- Step 5: Test query (should work now)
SELECT 
    'Test Query:' as check_type,
    COUNT(*) as total_cars 
FROM cars;

-- If you see cars here, everything is fixed!

-- Step 6: Also fix other tables
DO $$ 
DECLARE
    r RECORD;
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['service_logs', 'service_items', 'reminders']) LOOP
        -- Drop all policies
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, table_name);
        END LOOP;
        
        -- Disable RLS
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
        
        RAISE NOTICE 'Fixed table: %', table_name;
    END LOOP;
END $$;

-- Final verification
SELECT 
    tablename,
    rowsecurity as "RLS Enabled",
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as "Policy Count"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');
-- All should show: rowsecurity = false, Policy Count = 0

