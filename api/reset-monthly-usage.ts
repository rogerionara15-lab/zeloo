import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getMonthRangeUTC(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id ausente' });

    const { startISO, endISO } = getMonthRangeUTC(new Date());

    // busca chamados do mês atual
    const { data: rows, error: selErr } = await admin
      .from('requests')
      .select('id, created_at')
      .eq('user_id', user_id)
      .gte('created_at', startISO)
      .lt('created_at', endISO);

    if (selErr) {
      console.error('reset-monthly-usage select error:', selErr);
      return res.status(500).json({ error: 'Falha ao buscar chamados', detail: selErr.message });
    }

    const ids = (rows || []).map((r: any) => r.id);
    if (ids.length === 0) return res.status(200).json({ ok: true, moved: 0 });

    // move pro mês anterior (simples e garantido pra sair do range do mês atual)
    const movedDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();

    const { error: upErr } = await admin
      .from('requests')
      .update({ created_at: movedDate })
      .in('id', ids);

    if (upErr) {
      console.error('reset-monthly-usage update error:', upErr);
      return res.status(500).json({ error: 'Falha ao resetar contador', detail: upErr.message });
    }

    return res.status(200).json({ ok: true, moved: ids.length });
  } catch (e: any) {
    console.error('reset-monthly-usage unexpected:', e);
    return res.status(500).json({ error: 'Erro inesperado' });
  }
}
