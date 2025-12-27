# Testing Guide - Car Management Fix

## What I Just Fixed

I removed the `.single()` method from the Supabase queries which was causing the **"cannot coerce to single JSON object"** error. The queries now properly handle array responses.

I also added **console logging** to help us see exactly what's happening.

## Steps to Test

### 1. Deploy the New Code

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix car CRUD operations - remove .single() from queries"
   git push
   ```

2. **Wait for Vercel to deploy** (should be automatic)

### 2. Open Browser Console

Before testing, **open your browser's Developer Tools**:
- Press `F12` or `Ctrl+Shift+I` (Windows)
- Go to the **Console** tab

This will show you the detailed logs I added.

### 3. Test Each Operation

#### Test 1: Create a New Car
1. Click "Lägg till bil" (Add car)
2. Fill in the form:
   - Name: "Test Bil"
   - Make: "Toyota"
   - Model: "Corolla"
   - Year: 2020
   - Leave license plate empty (or add one)
3. Click "Lägg till bil"
4. **Check the console** - you should see:
   ```
   Inserting car: {...}
   Insert response: {...}
   Car created successfully: {...}
   ```
5. **Expected result:** Car should appear in your dashboard

#### Test 2: Edit a Car
1. Click on a car card
2. Click "Redigera" (Edit)
3. Change something (e.g., the name)
4. Click "Uppdatera bil"
5. **Check the console** - you should see:
   ```
   Updating car: {...}
   Update response: {...}
   Car updated successfully: {...}
   ```
6. **Expected result:** Changes should be saved and visible

#### Test 3: Delete a Car
1. Click on a car card
2. Click "Redigera" (Edit)
3. Scroll down and click "Ta bort bil" (Delete car)
4. Confirm the deletion
5. **Check the console** - you should see:
   ```
   Deleting car: <id>
   Delete response: {...}
   Car deleted successfully
   ```
6. **Expected result:** Car should disappear from dashboard

## What to Look For in Console

### ✅ Success Scenario
```javascript
Inserting car: {name: "Test", make: "Toyota", ...}
Insert response: {data: [{id: 1, name: "Test", ...}], error: null}
Car created successfully: {id: 1, name: "Test", ...}
```

### ❌ Error Scenarios

**If you see this:**
```javascript
Insert response: {data: null, error: {...}}
```
→ There's a database error. Copy the error message and send it to me.

**If you see this:**
```javascript
Insert response: {data: [], error: null}
No data returned from insert
```
→ The insert succeeded but no data was returned. This means **RLS policies** might be blocking the SELECT.

## If Still Not Working

If you still see issues, run the **diagnostic script** I created:

1. Go to Supabase SQL Editor
2. Run `diagnose-database.sql`
3. Send me the output

## Most Likely Issue

Based on your symptoms, I suspect the **RLS (Row Level Security) policies** might not be allowing the `.select()` after insert/update. The operations are succeeding, but the data isn't being returned.

If that's the case, we need to check the RLS policies in Supabase.
