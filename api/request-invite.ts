import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Não deixa GET crashar
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // ✅ Lê ENV (server-side)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({ error: 'Missing env: SUPABASE_URL' });
    }
    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Missing env: SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { email } = (req.body ?? {}) as { email?: string };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing email' });
    }

    const normalizedEmail = normalizeEmail(email);

    // ✅ 1) Verifica se está aprovado no paid_access
    const { data: accessRow, error: accessErr } = await supabaseAdmin
      .from('paid_access')
      .select('status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (accessErr) {
      return res.status(500).json({ error: 'DB error checking paid_access', details: accessErr.message });
    }

    if (!accessRow || accessRow.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Email not approved' });
    }

    // ✅ 2) Envia convite (criar senha)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail);

    if (error) {
      return res.status(500).json({ error: 'Invite failed', details: error.message });
    }

    return res.status(200).json({ ok: true, invited: true, user: data?.user ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unhandled error', details: e?.message ?? String(e) });
  }
}
