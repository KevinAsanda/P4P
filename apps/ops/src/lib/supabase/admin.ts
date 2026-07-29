import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client — uses the service_role key.
 * Bypasses Row Level Security and has full database access.
 * ONLY use server-side (Server Actions, API Routes). NEVER expose to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables. ' +
      'These are required for admin operations (staff invite, role assignment).'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
