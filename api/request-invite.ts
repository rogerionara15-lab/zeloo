import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Aceita POST apenas
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = (req.body ?? {}) as any;
    const emailRaw = body?.email;

    if (!emailRaw || typeof emailRaw !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const email = emailRaw.trim().toLowerCase();
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // ✅ TODO: aqui entra sua lógica real:
    // - salvar pedido no Supabase
    // - enviar convite via Supabase Admin
    // Por enquanto: responde OK (para build/fluxo não quebrar)
    return res.status(200).json({ ok: true, email });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Erro interno' });
  }
}
