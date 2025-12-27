# Fix Demo Cars and Schema Issues

## The Problem

You're seeing:
1. Can't edit/delete demo cars - likely because they have INTEGER IDs but code expects UUIDs
2. Can't create service logs - foreign key error because car_id type mismatch

## Root Cause

Your database has cars with INTEGER IDs (old schema), but the code expects UUIDs (new schema). This happens if:
- Demo cars were created before running `complete-database-setup.sql`
- OR the DROP TABLE statements weren't run in the SQL script

## Solution: Delete Old Cars and Recreate

### Step 1: Check Your Schema

Run this in Supabase SQL Editor:

```sql
-- Check what type your car IDs are
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'cars' AND column_name = 'id';
```

If it shows `integer` or `bigint`, you need to delete old cars.

### Step 2: Delete Old Demo Cars

Run this SQL to delete all existing cars (this will also delete related service logs, etc. due to CASCADE):

```sql
-- Delete all existing cars (will cascade to service_logs, reminders, etc.)
DELETE FROM cars;
```

### Step 3: Verify Schema is UUID

Run this to verify:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('cars', 'service_logs')
  AND column_name IN ('id', 'car_id')
ORDER BY table_name, column_name;
```

All should show `uuid` as data_type.

### Step 4: Create New Cars Through the UI

Now go to your app and create new cars. They will have UUID IDs and everything will work.

## Alternative: Check if Schema Needs Recreating

If your schema is still INTEGER, run the complete setup again:

1. Go to Supabase SQL Editor
2. Run `complete-database-setup.sql` (it will DROP and recreate all tables)
3. Create new cars through the UI

## After Fixing

Once you have cars with UUID IDs:
- ✅ Creating cars will work
- ✅ Editing cars will work  
- ✅ Deleting cars will work
- ✅ Creating service logs will work (no foreign key errors)

