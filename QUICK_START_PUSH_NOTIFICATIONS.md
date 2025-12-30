# Quick Start: Push Notifications

## 🚀 Quick Setup (5 Steps)

### 1. Generate VAPID Keys
```bash
npm install -g web-push
web-push generate-vapid-keys
```
Save the **Public Key** and **Private Key**.

### 2. Create Database Table
Run `create-push-subscriptions-table.sql` in Supabase SQL Editor.

### 3. Set Environment Variables

**Supabase Edge Functions** (Dashboard → Edge Functions → Environment Variables):
- `VAPID_PUBLIC_KEY` = your public key
- `VAPID_PRIVATE_KEY` = your private key  
- `VAPID_SUBJECT` = `mailto:your-email@example.com`

**Vercel** (Dashboard → Environment Variables):
- `VITE_VAPID_PUBLIC_KEY` = your public key
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key
- `VITE_SUPABASE_URL` = your Supabase URL

### 4. Deploy Edge Function
```bash
supabase functions deploy send-inspection-reminders
```

### 5. Deploy to Vercel
```bash
vercel --prod
```

## ✅ Done!

The cron job runs daily at 9 AM UTC and sends reminders 7 days before and on the inspection date.

## 📋 Files Created

- `create-push-subscriptions-table.sql` - Database table
- `supabase/functions/send-inspection-reminders/index.ts` - Edge Function
- `api/cron/inspection-reminders.ts` - Vercel Cron handler
- `vercel.json` - Cron configuration (updated)
- `client/src/hooks/use-push-notifications.ts` - Updated to save subscriptions

## 🔍 Testing

1. Enable push notifications in the app
2. Check `push_subscriptions` table in Supabase
3. Test Edge Function manually (see `PUSH_NOTIFICATIONS_SETUP.md`)

For detailed instructions, see `PUSH_NOTIFICATIONS_SETUP.md`.

