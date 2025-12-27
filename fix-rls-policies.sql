-- Fix RLS Policies for Cars Table
-- Run this if you're still having issues after deploying the code changes

-- First, let's check current RLS status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'cars';

-- Check existing policies
SELECT 
    policyname,
    cmd as "Command",
    qual as "USING expression",
    with_check as "WITH CHECK expression"
FROM pg_policies
WHERE tablename = 'cars';

-- If RLS policies exist but aren't working, drop and recreate them
-- This ensures they're correct

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;

-- Recreate policies with correct permissions
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

-- Verify policies were created
SELECT 
    policyname,
    cmd as "Command",
    permissive as "Permissive"
FROM pg_policies
WHERE tablename = 'cars'
ORDER BY cmd;

-- Test query to see if you can see any cars (run this while logged in)
-- This should return your cars if RLS is working correctly
SELECT id, name, make, model, year, user_id
FROM cars
WHERE user_id = auth.uid()
LIMIT 5;
