-- NUCLEAR RLS FIX
-- This will wipe all existing car security and set it up from scratch

-- 1. Disable RLS momentarily to clear the air
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- 2. Drop EVERY possible policy name that might be conflicting
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON cars;', ' ')
        FROM pg_policies 
        WHERE tablename = 'cars'
    );
END $$;

-- 3. Clean up any weird data types (Ensure user_id is a UUID)
-- Only run if user_id isn't already UUID
-- ALTER TABLE cars ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- 4. Re-enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- 5. Create one single, perfect policy for EVERYTHING
-- This allows you to do anything (Select, Insert, Update, Delete) 
-- as long as you are the owner.
CREATE POLICY "owner_full_access" 
ON cars 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Add a fallback for Select just in case
CREATE POLICY "owner_select" 
ON cars 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. CRITICAL: Grant permissions to authenticated role
GRANT ALL ON cars TO authenticated;
GRANT ALL ON cars TO postgres;
GRANT ALL ON cars TO service_role;

-- 8. Verify the current user session works
-- NOTE: In SQL Editor this will show nothing, but it tests the logic
SELECT auth.uid() as current_user_session;
