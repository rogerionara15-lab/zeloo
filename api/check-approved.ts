import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Só POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) return res.status(500).json({ error: 'Missing env: SUPABASE_URL' });
    if (!serviceRoleKey) return res.status(500).json({ error: 'Missing env: SUPABASE_SERVICE_ROLE_KEY' });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { email } = (req.body ?? {}) as { email?: string };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing email' });
    }

    const cleanEmail = normalizeEmail(email);

    const { data, error } = await supabaseAdmin
      .from('paid_access')
      .select('status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'DB error checking paid_access', details: error.message });
    }

    const status = data?.status || 'NOT_FOUND';
    const approved = status === 'APPROVED';

    return res.status(200).json({ approved, status });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unhandled error', details: e?.message ?? String(e) });
  }
}
