-- Re-enable RLS and fix policies properly
-- Run this AFTER testing to restore security

-- Step 1: Re-enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;

-- Step 3: Recreate policies correctly
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Verify RLS is enabled and policies exist
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');

SELECT 
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE tablename = 'cars'
ORDER BY cmd;

