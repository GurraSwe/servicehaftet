-- =====================================================
-- CHECK AND FIX DATABASE SCHEMA
-- Run this to check your current schema and fix issues
-- =====================================================

-- Step 1: Check the current data types of all ID columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('cars', 'service_logs', 'service_items', 'reminders')
  AND column_name IN ('id', 'car_id', 'service_log_id')
ORDER BY table_name, ordinal_position;

-- Step 2: Check if you have any existing data
SELECT 'cars' as table_name, COUNT(*) as row_count FROM cars
UNION ALL
SELECT 'service_logs', COUNT(*) FROM service_logs
UNION ALL
SELECT 'service_items', COUNT(*) FROM service_items
UNION ALL
SELECT 'reminders', COUNT(*) FROM reminders;

-- Step 3: Check sample car IDs to see what format they are
SELECT id, name, make, model, user_id FROM cars LIMIT 5;

-- =====================================================
-- IMPORTANT: Based on the results above, you need to:
-- 
-- If your cars.id is INTEGER:
--   1. You need to migrate your data OR
--   2. Delete old cars and recreate them with UUID schema
--
-- If your cars.id is UUID but service_logs.car_id is INTEGER:
--   1. You have a schema mismatch - run complete-database-setup.sql
--
-- =====================================================

-- Step 4: If you want to clean up and start fresh (WILL DELETE ALL DATA)
-- Uncomment the lines below:

-- DELETE FROM reminders;
-- DELETE FROM service_items;
-- DELETE FROM service_logs;
-- DELETE FROM cars;

-- Then run complete-database-setup.sql to recreate tables with UUID schema

-- =====================================================
-- Step 5: Verify your schema matches (should show UUID for all IDs)
-- =====================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('cars', 'service_logs', 'service_items', 'reminders')
  AND column_name IN ('id', 'car_id', 'service_log_id')
ORDER BY table_name, ordinal_position;

-- All data_type should be 'uuid' if schema is correct

