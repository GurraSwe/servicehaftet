-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates tables with Row Level Security enabled
-- All data is protected - users can only access their own data

-- Cars table (bilar)
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT,
  current_mileage INTEGER DEFAULT 0,
  service_interval_months INTEGER,
  service_interval_kilometers INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service logs table (serviceloggar)
CREATE TABLE IF NOT EXISTS service_logs (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  mileage INTEGER NOT NULL,
  total_cost INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service items table (serviceposter - enskilda arbeten i en service)
CREATE TABLE IF NOT EXISTS service_items (
  id SERIAL PRIMARY KEY,
  service_log_id INTEGER NOT NULL REFERENCES service_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  cost INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table (påminnelser)
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  due_mileage INTEGER,
  recurring BOOLEAN DEFAULT FALSE,
  interval_months INTEGER,
  interval_kilometers INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cars
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for service_logs
CREATE POLICY "Users can view own service_logs" ON service_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_logs" ON service_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_logs" ON service_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_logs" ON service_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for service_items
CREATE POLICY "Users can view own service_items" ON service_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service_items" ON service_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service_items" ON service_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service_items" ON service_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_car_id ON service_logs(car_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_user_id ON service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_service_items_service_log_id ON service_items(service_log_id);
CREATE INDEX IF NOT EXISTS idx_service_items_user_id ON service_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_car_id ON reminders(car_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
