-- CRITICAL RLS FIX FOR CARS TABLE
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;
DROP POLICY IF EXISTS "Enable all access for owners" ON cars;

-- 3. Create NEW policies using the most reliable method
-- FOR SELECT: Allows you to see your own cars
CREATE POLICY "Users can view own cars" 
ON cars FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- FOR INSERT: Allows you to create cars for yourself
CREATE POLICY "Users can insert own cars" 
ON cars FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- FOR UPDATE: Allows you to edit your own cars
CREATE POLICY "Users can update own cars" 
ON cars FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- FOR DELETE: Allows you to delete your own cars
CREATE POLICY "Users can delete own cars" 
ON cars FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Verify policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'cars';

-- 5. DIAGNOSTIC QUERY
-- Check if your current user ID matches any cars in the table
-- If this returns 0 rows but you have cars in the table, RLS is the problem.
SELECT id, name, user_id, (auth.uid() = user_id) as "Is Owner"
FROM cars;
