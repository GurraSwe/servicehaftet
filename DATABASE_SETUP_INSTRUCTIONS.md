# Database Setup Instructions

## Problem
You were getting 409 (Conflict) errors when creating/editing/deleting cars. This was due to:
1. Mismatch between database schema (SERIAL/integers) and code (UUIDs)
2. License plate constraint violations (empty strings vs NULL)
3. Data type mismatches

## Solution

### Step 1: Run the Complete SQL Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `complete-database-setup.sql`
4. **IMPORTANT**: The script includes `DROP TABLE` statements that will delete all existing data
   - If you want to keep existing data, comment out the DROP statements (lines 8-11)
   - The script will then use CREATE IF NOT EXISTS (but this won't fix existing schema issues)
5. Click "Run" to execute the script
6. Verify the output shows:
   - All tables created with UUID primary keys
   - RLS enabled on all tables
   - Policies created
   - Indexes created

### Step 2: Verify Database Schema

After running the SQL, verify your tables have UUID primary keys:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'cars' AND column_name = 'id';
```

You should see `data_type` = `uuid` (not `integer`).

### Step 3: Deploy Code Changes

The code has been updated to:
- ✅ Use UUID strings for all IDs (matching the database)
- ✅ Properly clean data (empty strings → NULL) to avoid 409 conflicts
- ✅ Handle create/update/delete operations correctly
- ✅ Update cache immediately so created cars appear in the list

Push the code to Vercel:
```bash
git add .
git commit -m "Fix car CRUD operations - align with UUID schema"
git push
```

### Step 4: Test

1. **Create a car**: Should work without 409 errors
2. **Edit a car**: Should work without 406 errors
3. **Delete a car**: Should work properly
4. **Check the list**: Created cars should appear immediately

## Key Changes

### Database Schema
- All `id` columns are now `UUID` (not `SERIAL`/`INTEGER`)
- License plate has a unique constraint that allows multiple NULLs
- All tables use UUID foreign keys

### Code Changes
- All types use `string` for IDs (UUIDs)
- Data cleaning function converts empty strings to NULL
- Proper error handling for all operations
- Cache invalidation ensures UI updates immediately

## Troubleshooting

### Still getting 409 errors?
- Check if license_plate has empty strings instead of NULL in the database
- Run this to clean up: `UPDATE cars SET license_plate = NULL WHERE license_plate = '';`

### Still getting 406 errors?
- Make sure you're using the latest code with the separated update/fetch pattern

### Cars not appearing after creation?
- Check browser console for errors
- Verify RLS policies allow SELECT operations
- Check that user_id matches your authenticated user

## Database Schema Summary

```
cars
  - id: UUID (primary key)
  - user_id: UUID (foreign key to auth.users)
  - name: TEXT
  - make: TEXT
  - model: TEXT
  - year: INTEGER
  - vin: TEXT (nullable)
  - license_plate: TEXT (nullable, unique per user when not NULL)
  - current_mileage: INTEGER
  - service_interval_months: INTEGER (nullable)
  - service_interval_kilometers: INTEGER (nullable)
  - notes: TEXT (nullable)
  - created_at: TIMESTAMPTZ

service_logs
  - id: UUID (primary key)
  - car_id: UUID (foreign key to cars)
  - user_id: UUID (foreign key to auth.users)
  - ... (other fields)

service_items
  - id: UUID (primary key)
  - service_log_id: UUID (foreign key to service_logs)
  - user_id: UUID (foreign key to auth.users)
  - ... (other fields)

reminders
  - id: UUID (primary key)
  - car_id: UUID (foreign key to cars)
  - user_id: UUID (foreign key to auth.users)
  - ... (other fields)
```

All tables have:
- RLS enabled
- Policies for SELECT, INSERT, UPDATE, DELETE
- Indexes on foreign keys and user_id
- CASCADE deletes on foreign keys

