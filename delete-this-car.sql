-- Delete the demo car
-- Run this to remove the specific car

DELETE FROM cars WHERE id = '68fc3440-59b1-4bff-953a-77bf5aa70c26';

-- Verify deletion
SELECT COUNT(*) as remaining_cars FROM cars;
-- Should return 0

-- Also verify the car is gone
SELECT * FROM cars WHERE id = '68fc3440-59b1-4bff-953a-77bf5aa70c26';
-- Should return 0 rows

