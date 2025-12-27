-- Check and Fix RLS Policies for Cars Table
-- Run this in Supabase SQL Editor

-- Step 1: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'cars';

-- Step 2: Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as "Command",
    qual as "USING expression",
    with_check as "WITH CHECK expression"
FROM pg_policies
WHERE tablename = 'cars';

-- Step 3: Drop existing policies (to recreate them correctly)
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;

-- Step 4: Recreate policies with correct permissions
-- These policies ensure users can only see/manage their own cars

CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 5: Verify policies were created
SELECT 
    policyname,
    cmd as "Command",
    permissive as "Permissive"
FROM pg_policies
WHERE tablename = 'cars'
ORDER BY cmd;

-- Step 6: Test query (this will show YOUR cars only when logged in)
-- Replace YOUR_USER_ID with your actual user ID from the browser console
-- SELECT id, name, make, model, user_id 
-- FROM cars 
-- WHERE user_id = auth.uid();

-- IMPORTANT: Make sure you're logged in when running this script
-- The policies use auth.uid() which requires an active session

