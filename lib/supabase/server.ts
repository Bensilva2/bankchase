import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using service role key.
 *
 * This app uses custom auth (password hashing + OTP) instead of Supabase Auth,
 * so auth.uid() is not available for RLS policies. We use the service role key
 * to bypass RLS on all server-side operations.
 *
 * IMPORTANT: Only use this in server-side API routes, never expose to client.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

// Alias for clarity  
export const createServiceClient = createClient
