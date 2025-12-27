-- Delete ALL cars from database
-- Use this if you want to start completely fresh

DELETE FROM cars;

-- Verify all cars are deleted
SELECT COUNT(*) as total_cars FROM cars;
-- Should return 0

