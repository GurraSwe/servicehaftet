-- Force disable RLS on all tables
-- Run this to ensure RLS is completely disabled

-- Disable RLS on all tables
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

-- Test query (should return all cars)
SELECT COUNT(*) as total_cars FROM cars;

-- If you see cars here, RLS is disabled and working

