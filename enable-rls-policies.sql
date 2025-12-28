-- Enable RLS and Create Proper Policies for All Tables
-- Run this ENTIRE script in Supabase SQL Editor
-- This will enable Row Level Security and create policies that allow users to only access their own data

-- ============================================
-- STEP 1: Enable RLS on all tables
-- ============================================
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop all existing policies (clean slate)
-- ============================================
DO $$ 
DECLARE
    r RECORD;
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['cars', 'service_logs', 'service_items', 'reminders']) LOOP
        -- Drop all policies on each table
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name
        ) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, table_name);
            RAISE NOTICE 'Dropped policy: % on table: %', r.policyname, table_name;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Create RLS Policies for CARS table
-- ============================================
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

-- ============================================
-- STEP 4: Create RLS Policies for SERVICE_LOGS table
-- ============================================
CREATE POLICY "Users can view own service_logs" ON service_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_logs" ON service_logs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_logs" ON service_logs
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_logs" ON service_logs
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create RLS Policies for SERVICE_ITEMS table
-- ============================================
CREATE POLICY "Users can view own service_items" ON service_items
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_items" ON service_items
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_items" ON service_items
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_items" ON service_items
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: Create RLS Policies for REMINDERS table
-- ============================================
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Verify RLS is enabled
-- ============================================
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders')
ORDER BY tablename;
-- All should show: rowsecurity = true

-- ============================================
-- STEP 8: Verify policies were created
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders')
ORDER BY tablename, cmd;
-- Should show 16 policies total (4 policies × 4 tables)

-- ============================================
-- STEP 9: Summary
-- ============================================
SELECT 
    tablename,
    rowsecurity as "RLS Enabled",
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as "Policy Count"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders')
ORDER BY tablename;
-- All should show: rowsecurity = true, Policy Count = 4

-- ============================================
-- DONE! RLS is now enabled with proper policies.
-- Users can only access their own data.
-- ============================================

