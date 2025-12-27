# RLS Testing Guide

## Temporary Testing (NOT for Production)

If you want to quickly test if RLS is the issue:

### Step 1: Disable RLS Temporarily

Run `disable-rls-temp.sql` in Supabase SQL Editor:

```sql
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
```

### Step 2: Test Your App

Now try:
- Creating a car - should work
- The car should appear in the list immediately

### Step 3: Re-enable RLS Properly

**IMPORTANT**: After testing, you MUST re-enable RLS for security!

Run `re-enable-rls.sql` to restore security properly.

## Why RLS Might Not Be Working

Common issues:

1. **Policies not created correctly** - They might be missing or have wrong syntax
2. **auth.uid() not matching user_id** - The user ID format might be different
3. **Session not passed correctly** - Supabase client might not be sending auth headers

## Proper Fix

Instead of disabling RLS permanently, fix the policies:

1. **Check if policies exist:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'cars';
```

2. **Check if RLS is enabled:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'cars';
```

3. **Recreate policies correctly** (use `check-rls-policies.sql`)

## Testing RLS Policies

To test if your policies work:

```sql
-- Check what auth.uid() returns (when logged in via Supabase dashboard)
SELECT auth.uid();

-- Check what user_id your cars have
SELECT id, name, user_id FROM cars LIMIT 5;

-- They should match!
```

If they don't match, that's your problem - the policies won't work.

## Recommendation

1. ✅ Disable RLS temporarily to confirm it's the issue
2. ✅ If cars appear, RLS is definitely the problem
3. ✅ Re-enable RLS immediately
4. ✅ Fix the policies properly (run `check-rls-policies.sql`)
5. ✅ Test again - should work with RLS enabled

**Never leave RLS disabled in production!**

