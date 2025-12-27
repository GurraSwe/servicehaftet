-- Remove ALL RLS policies from cars table
-- This is needed because policies can still block queries even if RLS is disabled

-- Drop ALL policies on cars table
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;
DROP POLICY IF EXISTS "Enable read access for all users" ON cars;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON cars;
DROP POLICY IF EXISTS "Enable update for users based on email" ON cars;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON cars;

-- Drop policies on other tables too
DROP POLICY IF EXISTS "Users can view own service_logs" ON service_logs;
DROP POLICY IF EXISTS "Users can insert own service_logs" ON service_logs;
DROP POLICY IF EXISTS "Users can update own service_logs" ON service_logs;
DROP POLICY IF EXISTS "Users can delete own service_logs" ON service_logs;

DROP POLICY IF EXISTS "Users can view own service_items" ON service_items;
DROP POLICY IF EXISTS "Users can insert own service_items" ON service_items;
DROP POLICY IF EXISTS "Users can update own service_items" ON service_items;
DROP POLICY IF EXISTS "Users can delete own service_items" ON service_items;

DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

-- Verify all policies are gone
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');

-- Should return 0 rows (no policies)

-- Also ensure RLS is disabled
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');

-- All should show: rowsecurity = false

