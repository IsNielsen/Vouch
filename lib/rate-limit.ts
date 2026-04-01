import { createAdminClient } from "@/lib/supabase/admin";

const LIMIT = 10;
const WINDOW_SECONDS = 60;

/**
 * Returns true if the request should be allowed, false if rate limited.
 * Uses Supabase to persist counters across serverless instances.
 * Fails open on DB error to avoid blocking legitimate users.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

  const { data, error } = await admin.rpc("increment_rate_limit", {
    p_ip: ip,
    p_window_start: windowStart,
    p_limit: LIMIT,
  });

  if (error) {
    console.error("[rate-limit]", error.message);
    return true; // fail open
  }

  return data as boolean;
}
