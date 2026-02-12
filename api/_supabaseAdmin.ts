import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env: VITE_SUPABASE_URL');
}
if (!serviceRoleKey) {
  throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');
}

// Cliente ADMIN (server-side). Nunca usar isso no front.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
