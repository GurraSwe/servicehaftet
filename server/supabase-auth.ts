import type { Request, Response, NextFunction, Express, RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

async function ensureUserExists(userId: string, email: string | undefined): Promise<void> {
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!existingUser) {
    await db.insert(users).values({
      id: userId,
      email: email || null,
    });
  }
}

export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await ensureUserExists(user.id, user.email);

    req.userId = user.id;
    req.userEmail = user.email;
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export function registerAuthRoutes(app: Express): void {
  app.get("/api/supabase-config", (req: Request, res: Response) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ message: "Supabase not configured" });
    }
    res.json({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      res.json({
        id: req.userId,
        email: req.userEmail,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
