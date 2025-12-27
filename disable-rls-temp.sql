-- TEMPORARY: Disable RLS for testing only
-- ⚠️ WARNING: This disables security! Only use for testing/debugging
-- ⚠️ DO NOT use this in production - it makes all data visible to everyone!

-- Disable RLS on cars table
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- Optional: Disable on other tables too if needed for testing
-- ALTER TABLE service_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'cars';

-- Should show: rowsecurity = false

