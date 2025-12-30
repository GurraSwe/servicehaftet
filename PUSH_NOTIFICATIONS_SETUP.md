# Push Notifications Setup Guide

This guide explains how to set up push notifications for inspection reminders.

## Overview

The system uses:
- **Web Push API** for browser push notifications
- **Supabase Edge Function** to check for upcoming inspections and send notifications
- **Vercel Cron** to trigger the Edge Function daily at 9 AM UTC

## Step 1: Generate VAPID Keys

VAPID keys are required for Web Push notifications. Generate them using one of these methods:

### Option A: Using Node.js (Recommended)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
- **Public Key**: Use this as `VITE_VAPID_PUBLIC_KEY` in your client
- **Private Key**: Use this as `VAPID_PRIVATE_KEY` in Supabase Edge Functions

### Option B: Using Online Tool

Visit: https://web-push-codelab.glitch.me/

## Step 2: Set Up Database

Run the SQL script to create the push subscriptions table:

```sql
-- Run this in Supabase SQL Editor
-- File: create-push-subscriptions-table.sql
```

## Step 3: Configure Environment Variables

### Client-side (Vercel/Environment)

Add to your `.env` or Vercel environment variables:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Edge Function

In Supabase Dashboard → Project Settings → Edge Functions → Environment Variables:

```env
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
SUPABASE_URL=your_supabase_url (usually auto-set)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (usually auto-set)
CRON_SECRET=your_random_secret_string (optional, for security)
```

### Vercel Serverless Function

In Vercel Dashboard → Project Settings → Environment Variables:

```env
CRON_SECRET=your_random_secret_string (must match Supabase if used)
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (required for Edge Function calls)
```

## Step 4: Deploy Supabase Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-inspection-reminders
   ```

## Step 5: Deploy to Vercel

The cron job is already configured in `vercel.json`. Just deploy:

```bash
vercel --prod
```

Or push to your connected Git repository.

## Step 6: Test

1. **Test push subscription:**
   - Open your app
   - Click "Aktivera pushnotiser"
   - Check Supabase `push_subscriptions` table - you should see a new row

2. **Test Edge Function manually:**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-inspection-reminders \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

3. **Test cron job:**
   - Go to Vercel Dashboard → Your Project → Cron Jobs
   - You should see the scheduled job
   - Wait for it to run or trigger manually

## How It Works

1. **User subscribes:** When user enables push notifications, subscription is saved to `push_subscriptions` table
2. **Daily check:** Vercel Cron calls `/api/cron/inspection-reminders` daily at 9 AM UTC
3. **Edge Function:** The function:
   - Queries cars with `last_inspection_date`
   - Calculates `next_inspection_date` (last_inspection_date + 14 months)
   - Finds cars where inspection is due in 7 days or today
   - Fetches push subscriptions for those users
   - Sends push notifications via Web Push API

## Notification Timing

- **7 days before:** Users receive a reminder
- **On the day:** Users receive another reminder

## Troubleshooting

### Notifications not working?

1. **Check browser permissions:** User must grant notification permission
2. **Check VAPID keys:** Make sure they match between client and server
3. **Check subscriptions:** Verify entries in `push_subscriptions` table
4. **Check Edge Function logs:** Supabase Dashboard → Edge Functions → Logs
5. **Check Vercel Cron logs:** Vercel Dashboard → Functions → Logs

### Edge Function errors?

- Check environment variables are set correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
- Check function logs in Supabase Dashboard

### Cron not running?

- Verify `vercel.json` has the cron configuration
- Check Vercel Dashboard → Cron Jobs
- Ensure the API route exists at `/api/cron/inspection-reminders`

## Security Notes

- The `CRON_SECRET` is optional but recommended for production
- The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (required)
- Push subscriptions are protected by RLS policies (users can only see their own)

## Cost Considerations

- **Supabase Edge Functions:** Pay per invocation (very cheap)
- **Vercel Cron:** Free tier includes cron jobs
- **Web Push:** No additional cost

