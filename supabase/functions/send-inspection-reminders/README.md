# Send Inspection Reminders Edge Function

This Supabase Edge Function checks for cars with upcoming inspections and sends push notifications to subscribed users.

## Setup

1. **Deploy the function to Supabase:**
   ```bash
   supabase functions deploy send-inspection-reminders
   ```

2. **Set environment variables in Supabase Dashboard:**
   - Go to Project Settings → Edge Functions → Environment Variables
   - Add the following:
     - `VAPID_PUBLIC_KEY` - Your VAPID public key
     - `VAPID_PRIVATE_KEY` - Your VAPID private key
     - `VAPID_SUBJECT` - Your email (e.g., `mailto:your-email@example.com`)
     - `SUPABASE_URL` - Your Supabase project URL (usually auto-set)
     - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (usually auto-set)
     - `CRON_SECRET` - (Optional) Secret for securing the cron endpoint

## How it works

1. Queries all cars with `last_inspection_date` set
2. Calculates `next_inspection_date` (last_inspection_date + 14 months)
3. Finds cars where inspection is due in 7 days or today
4. Fetches push subscriptions for those users
5. Sends push notifications with Swedish text

## Triggering

This function should be called daily by Vercel Cron (see `vercel.json`).

## Testing

You can test the function manually:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-inspection-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

