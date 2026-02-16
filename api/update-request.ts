import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id, status, visit_cost } = req.body || {};

    if (!id || !status) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const st = String(status).toUpperCase();

    const payload: any = { status: st };

    if (typeof visit_cost === 'number') payload.visit_cost = visit_cost;

    if (st === 'COMPLETED') payload.completed_at = new Date().toISOString();
    if (st === 'CANCELLED') payload.cancelled_at = new Date().toISOString();
    if (st === 'SCHEDULED') {
      // opcional: você pode guardar scheduled_at se quiser no futuro
    }

    const { error } = await admin.from('requests').update(payload).eq('id', id);

    if (error) {
      console.error('update-request error:', error);
      return res.status(500).json({ error: 'Falha ao atualizar chamado', detail: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('update-request unexpected:', e);
    return res.status(500).json({ error: 'Erro inesperado' });
  }
}
