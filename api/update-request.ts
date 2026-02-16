import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ✅ Tabela simples pra guardar estados do admin (universal)
const ADMIN_STATE_TABLE = 'admin_state';
const REQUESTS_LAST_SEEN_KEY = 'requests_last_seen_v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const action = String(body?.action || '').trim().toUpperCase();

    // ============================================================
    // ✅ NOVO: UNIVERSAL lastSeen da O.S (sem criar arquivo novo)
    // ============================================================

    // 1) Buscar lastSeen
    if (action === 'GET_LAST_SEEN_REQUESTS') {
      const { data, error } = await admin
        .from(ADMIN_STATE_TABLE)
        .select('value')
        .eq('key', REQUESTS_LAST_SEEN_KEY)
        .single();

      // PGRST116 = "No rows found" (normal quando ainda não salvou nada)
      if (error && (error as any).code !== 'PGRST116') {
        console.error('GET_LAST_SEEN_REQUESTS error:', error);
        return res.status(500).json({ error: 'Falha ao carregar lastSeen', detail: (error as any).message });
      }

      return res.status(200).json({ lastSeen: data?.value || '' });
    }

    // 2) Salvar lastSeen
    if (action === 'SET_LAST_SEEN_REQUESTS') {
      const lastSeen = String(body?.lastSeen || '').trim();
      if (!lastSeen) {
        return res.status(400).json({ error: 'lastSeen inválido' });
      }

      const { error } = await admin
        .from(ADMIN_STATE_TABLE)
        .upsert({ key: REQUESTS_LAST_SEEN_KEY, value: lastSeen }, { onConflict: 'key' });

      if (error) {
        console.error('SET_LAST_SEEN_REQUESTS error:', error);
        return res.status(500).json({ error: 'Falha ao salvar lastSeen', detail: (error as any).message });
      }

      return res.status(200).json({ ok: true });
    }

    // ============================================================
    // ✅ ORIGINAL: atualizar status do chamado (NÃO muda comportamento)
    // ============================================================

    const { id, status, visit_cost } = body || {};

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
