-- =====================================================
-- COMPLETE DATABASE SETUP FOR SERVICE HAFTET
-- Run this entire script in Supabase SQL Editor
-- This will recreate the database schema correctly
-- =====================================================

-- Step 1: Drop existing tables if they exist (CASCADE to handle foreign keys)
-- WARNING: This will delete all data! Only run this if you want to start fresh.
-- If you want to keep data, comment out the DROP statements and the script will use CREATE IF NOT EXISTS

DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS service_items CASCADE;
DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS cars CASCADE;

-- Step 2: Create the cars table with UUID primary key
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT,
  current_mileage INTEGER DEFAULT 0 NOT NULL,
  service_interval_months INTEGER,
  service_interval_kilometers INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Create service_logs table
CREATE TABLE service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  mileage INTEGER NOT NULL,
  total_cost INTEGER DEFAULT 0 NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 4: Create service_items table
CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_log_id UUID NOT NULL REFERENCES service_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  cost INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 5: Create reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  due_mileage INTEGER,
  recurring BOOLEAN DEFAULT FALSE NOT NULL,
  interval_months INTEGER,
  interval_kilometers INTEGER,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 6: Enable Row Level Security on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;

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

-- Step 8: Create RLS Policies for cars
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- Step 9: Create RLS Policies for service_logs
CREATE POLICY "Users can view own service_logs" ON service_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_logs" ON service_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_logs" ON service_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_logs" ON service_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create RLS Policies for service_items
CREATE POLICY "Users can view own service_items" ON service_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_items" ON service_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_items" ON service_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_items" ON service_items
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Create RLS Policies for reminders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Step 12: Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_cars_user_id;
DROP INDEX IF EXISTS idx_service_logs_car_id;
DROP INDEX IF EXISTS idx_service_logs_user_id;
DROP INDEX IF EXISTS idx_service_items_service_log_id;
DROP INDEX IF EXISTS idx_service_items_user_id;
DROP INDEX IF EXISTS idx_reminders_car_id;
DROP INDEX IF EXISTS idx_reminders_user_id;
DROP INDEX IF EXISTS cars_user_plate_unique;

-- Step 13: Create indexes for better performance
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_service_logs_car_id ON service_logs(car_id);
CREATE INDEX idx_service_logs_user_id ON service_logs(user_id);
CREATE INDEX idx_service_items_service_log_id ON service_items(service_log_id);
CREATE INDEX idx_service_items_user_id ON service_items(user_id);
CREATE INDEX idx_reminders_car_id ON reminders(car_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);

-- Step 14: Create unique constraint for license_plate (allows multiple NULLs)
-- This ensures users can have multiple cars without license plates, but not duplicate plates
CREATE UNIQUE INDEX cars_user_plate_unique 
ON cars(user_id, license_plate) 
WHERE license_plate IS NOT NULL;

-- Step 15: Verify the setup
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('cars', 'service_logs', 'service_items', 'reminders')
ORDER BY table_name, ordinal_position;

-- Step 16: Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders');

-- Step 17: Verify policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE tablename IN ('cars', 'service_logs', 'service_items', 'reminders')
ORDER BY tablename, cmd;

-- =====================================================
-- SETUP COMPLETE!
-- All tables are now created with UUID primary keys
-- RLS is enabled with proper policies
-- Indexes are created for performance
-- License plate constraint allows NULLs but enforces uniqueness when not NULL
-- =====================================================

