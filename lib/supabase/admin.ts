import { createClient } from "@supabase/supabase-js";

// Server-side only — never expose to client
// Uses untyped client to avoid Supabase v2 generics inference issues;
// callers apply explicit type assertions on results.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
