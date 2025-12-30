# Environment Variables Checklist

## ✅ What You Already Have in Vercel

- ✅ `VAPID_PUBLIC_KEY`
- ✅ `VAPID_PRIVATE_KEY`
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

## 🔧 What to Add

### 1. In Vercel (Add These)

Add these environment variables in Vercel Dashboard → Project Settings → Environment Variables:

```
SUPABASE_SERVICE_ROLE_KEY
```
- **Value**: Your Supabase Service Role Key
- **Where to find**: Supabase Dashboard → Project Settings → API → `service_role` key (secret)
- **Why**: Needed for the cron job to call the Edge Function with proper permissions

```
CRON_SECRET (Optional but recommended)
```
- **Value**: Any random string (e.g., `my-secret-cron-key-12345`)
- **Why**: Security - prevents unauthorized access to your cron endpoint

### 2. In Supabase Edge Functions (Add These)

Go to **Supabase Dashboard → Project Settings → Edge Functions → Environment Variables**

Add these environment variables:

```
VAPID_PUBLIC_KEY
```
- **Value**: Same as your Vercel `VAPID_PUBLIC_KEY`
- **Copy from**: Your Vercel environment variables

```
VAPID_PRIVATE_KEY
```
- **Value**: Same as your Vercel `VAPID_PRIVATE_KEY`
- **Copy from**: Your Vercel environment variables

```
VAPID_SUBJECT
```
- **Value**: `mailto:your-email@example.com` (replace with your actual email)
- **Example**: `mailto:admin@servicehaftet.com`
- **Why**: Required by VAPID protocol - identifies who the push notifications are from
- **Important**: Must start with `mailto:` and be a valid email format

```
SUPABASE_URL (Usually auto-set)
```
- **Value**: Your Supabase project URL
- **Note**: This is usually automatically set, but verify it's there

```
SUPABASE_SERVICE_ROLE_KEY (Usually auto-set)
```
- **Value**: Your Supabase Service Role Key
- **Note**: This is usually automatically set, but verify it's there

```
CRON_SECRET (Optional - must match Vercel if used)
```
- **Value**: Same random string as in Vercel (if you added it)
- **Why**: Security check in Edge Function

## 📋 Quick Summary

### Vercel - Add:
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **REQUIRED**
- `CRON_SECRET` (optional)

### Supabase Edge Functions - Add:
- `VAPID_PUBLIC_KEY` ⚠️ **REQUIRED**
- `VAPID_PRIVATE_KEY` ⚠️ **REQUIRED**
- `VAPID_SUBJECT` ⚠️ **REQUIRED** (format: `mailto:your-email@example.com`)

## ✅ After Adding Variables

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy send-inspection-reminders
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Test:**
   - Enable push notifications in your app
   - Check `push_subscriptions` table in Supabase
   - Wait for cron job or test manually

