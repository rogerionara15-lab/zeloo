import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, description, is_urgent } = req.body || {};

    if (!user_id || !description || String(description).trim().length < 3) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const { data: requestId, error } = await admin.rpc('create_request_consuming_extra', {
      p_user_id: user_id,
      p_description: String(description),
      p_is_urgent: Boolean(is_urgent),
    });

    if (error) {
      const msg = String(error.message || '');

      if (msg.includes('NO_EXTRAS')) return res.status(409).json({ code: 'NO_EXTRAS' });
      if (msg.includes('PLAN_NOT_ALLOWED')) return res.status(409).json({ code: 'PLAN_NOT_ALLOWED' });
      if (msg.includes('NOT_PAID')) return res.status(403).json({ code: 'NOT_PAID' });
      if (msg.includes('BLOCKED')) return res.status(403).json({ code: 'BLOCKED' });

      console.error('RPC error:', error);
      return res.status(500).json({ error: 'Falha ao criar chamado', detail: msg });
    }

    return res.status(200).json({ request_id: requestId });
  } catch (e: any) {
    console.error('create-request unexpected:', e);
    return res.status(500).json({ error: 'Erro inesperado' });
  }
}
