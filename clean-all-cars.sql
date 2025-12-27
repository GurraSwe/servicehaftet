-- Clean ALL cars from database
-- Run this to remove all cars including demo cars
-- ⚠️ This will delete ALL cars - use with caution!

-- Delete all cars (this will cascade to service_logs, reminders, etc.)
DELETE FROM cars;

-- Verify deletion
SELECT COUNT(*) as remaining_cars FROM cars;
-- Should return 0

-- Check for any remaining related data
SELECT COUNT(*) as service_logs FROM service_logs;
SELECT COUNT(*) as reminders FROM reminders;
SELECT COUNT(*) as service_items FROM service_items;

-- All should be 0 after cascade delete

