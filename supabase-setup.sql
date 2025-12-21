-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates tables with Row Level Security enabled

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
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

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  mileage INTEGER NOT NULL,
  type TEXT NOT NULL,
  cost INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  due_mileage INTEGER,
  recurring BOOLEAN DEFAULT FALSE,
  interval_months INTEGER,
  interval_miles INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
-- Users can only see their own vehicles
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for services
-- Users can only access services for their own vehicles
CREATE POLICY "Users can view services for own vehicles" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = services.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert services for own vehicles" ON services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = services.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update services for own vehicles" ON services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = services.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete services for own vehicles" ON services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = services.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

-- RLS Policies for reminders
-- Users can only access reminders for their own vehicles
CREATE POLICY "Users can view reminders for own vehicles" ON reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reminders for own vehicles" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reminders for own vehicles" ON reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reminders for own vehicles" ON reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);
