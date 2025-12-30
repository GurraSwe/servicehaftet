// Supabase Edge Function to send inspection reminder push notifications
// This function checks for cars with upcoming inspections (7 days before or today)
// and sends push notifications to subscribed users

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/web-push@3.6.6"
import { sendNotification } from "npm:web-push@3.6.6";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:your-email@example.com";

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface Car {
  id: string;
  user_id: string;
  name: string;
  make: string;
  model: string;
  last_inspection_date: string | null;
}

// Calculate next inspection date (last_inspection_date + 14 months)
function calculateNextInspectionDate(lastInspectionDate: string | null): Date | null {
  if (!lastInspectionDate) return null;
  
  const date = new Date(lastInspectionDate);
  if (isNaN(date.getTime())) return null;
  
  // Add 14 months
  date.setMonth(date.getMonth() + 14);
  return date;
}

// Get days until inspection
function getDaysUntilInspection(nextInspectionDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inspection = new Date(nextInspectionDate);
  inspection.setHours(0, 0, 0, 0);
  
  const diffTime = inspection.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Send push notification using Web Push API
async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  url: string = "/dashboard"
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const vapidDetails = {
      subject: VAPID_SUBJECT,
      publicKey: VAPID_PUBLIC_KEY!,
      privateKey: VAPID_PRIVATE_KEY!,
    };

    const payload = JSON.stringify({
      title,
      body,
      url,
    });

    await sendNotification(pushSubscription, payload, {
      vapidDetails,
      TTL: 86400, // 24 hours
    });

    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

serve(async (req) => {
  try {
    // Verify the request is from Vercel Cron (optional security check)
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error("Missing VAPID keys");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all cars with last_inspection_date
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("id, user_id, name, make, model, last_inspection_date")
      .not("last_inspection_date", "is", null);

    if (carsError) {
      throw new Error(`Error fetching cars: ${carsError.message}`);
    }

    if (!cars || cars.length === 0) {
      return new Response(
        JSON.stringify({ message: "No cars with inspection dates found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find cars with inspections due in 7 days or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const carsNeedingReminder: Array<{ car: Car; nextInspectionDate: Date; daysUntil: number }> = [];

    for (const car of cars) {
      const nextInspectionDate = calculateNextInspectionDate(car.last_inspection_date);
      if (!nextInspectionDate) continue;

      const daysUntil = getDaysUntilInspection(nextInspectionDate);
      
      // Send reminder 7 days before or on the day
      if (daysUntil === 0 || daysUntil === 7) {
        carsNeedingReminder.push({
          car,
          nextInspectionDate,
          daysUntil,
        });
      }
    }

    if (carsNeedingReminder.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inspections due for reminders" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get push subscriptions for users with cars needing reminders
    const userIds = [...new Set(carsNeedingReminder.map((item) => item.car.user_id))];
    
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (subsError) {
      throw new Error(`Error fetching subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Group subscriptions by user_id
    const subscriptionsByUser = new Map<string, PushSubscription[]>();
    for (const sub of subscriptions) {
      if (!subscriptionsByUser.has(sub.user_id)) {
        subscriptionsByUser.set(sub.user_id, []);
      }
      subscriptionsByUser.get(sub.user_id)!.push({
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        user_id: sub.user_id,
      });
    }

    // Send notifications
    let sentCount = 0;
    let errorCount = 0;

    for (const { car, daysUntil } of carsNeedingReminder) {
      const userSubscriptions = subscriptionsByUser.get(car.user_id) || [];
      
      if (userSubscriptions.length === 0) continue;

      const title = "Besiktningspåminnelse";
      const body = daysUntil === 0
        ? `Det är dags för besiktning av din ${car.make} ${car.model} (${car.name}). Glöm inte att boka i tid.`
        : `Det är snart dags för besiktning av din ${car.make} ${car.model} (${car.name}). Glöm inte att boka i tid.`;

      // Send to all subscriptions for this user
      for (const subscription of userSubscriptions) {
        const success = await sendPushNotification(
          subscription,
          title,
          body,
          `/vehicle/${car.id}`
        );
        
        if (success) {
          sentCount++;
        } else {
          errorCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Inspection reminders processed",
        carsChecked: cars.length,
        remindersSent: sentCount,
        errors: errorCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-inspection-reminders:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

