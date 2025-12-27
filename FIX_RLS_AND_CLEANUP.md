# Fix RLS and Clean Up Demo Cars

## The Problem

1. Cars are created but don't show in UI (returns 0 cars)
2. Demo cars keep coming back

## Solution

### Step 1: Clean ALL Cars

Run `clean-all-cars.sql`:

```sql
DELETE FROM cars;
```

This removes all cars including demo cars.

### Step 2: Disable RLS Temporarily to Test

Run `disable-rls-temp.sql`:

```sql
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
```

### Step 3: Test Creating a Car

- Create a car through the UI
- It should appear immediately
- Check console logs - should see "Car verified - can be fetched successfully"

### Step 4: If It Works, Re-enable RLS Properly

Run `re-enable-rls.sql` or:

```sql
-- Re-enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;

-- Create new policies
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 5: Check for Demo Car Creation

Run `prevent-demo-cars.sql` to check if anything is automatically creating demo cars:

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cars';
```

If you see any triggers, they might be creating demo cars automatically.

## Why Cars Don't Appear

The console shows:
- "Creating car with user_id: ..." ✅
- "Car created successfully!" ✅
- "Fetched cars from database: 0 cars" ❌

This means:
- Car is created in database ✅
- But RLS policies prevent reading it back ❌

## Quick Test Sequence

1. ✅ Delete all cars: `DELETE FROM cars;`
2. ✅ Disable RLS: `ALTER TABLE cars DISABLE ROW LEVEL SECURITY;`
3. ✅ Create a car in UI
4. ✅ If it appears → RLS is the problem
5. ✅ Re-enable RLS with correct policies
6. ✅ Test again - should work

## If Demo Cars Keep Coming Back

Check for:
- Database triggers creating them automatically
- Seed scripts running on deployment
- Functions that create demo data
- Check Supabase dashboard for any automatic data seeding

Run `prevent-demo-cars.sql` to investigate.

