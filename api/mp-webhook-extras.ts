import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // MP pode mandar GET ou POST dependendo do evento
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) return res.status(500).json({ error: 'Missing MERCADOPAGO_ACCESS_TOKEN' });

    // ✅ Server-side Supabase Admin (service role)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({
        error: 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env',
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    // Mercado Pago manda algo tipo { data: { id } } ou querystring
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.data?.id ||
      req.query?.id;

    if (!paymentId) {
      // responde 200 para o MP não ficar insistindo
      return res.status(200).json({ ok: true, ignored: 'no payment id' });
    }

    // 1) Consultar o pagamento no MP (fonte da verdade)
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    const pay = await mpResp.json().catch(() => null);

    if (!mpResp.ok || !pay) {
      return res.status(200).json({ ok: true, ignored: 'mp fetch failed', pay });
    }

    // 2) Só processa quando aprovado
    if (pay?.status !== 'approved') {
      return res.status(200).json({ ok: true, ignored: `status=${pay?.status}` });
    }

    // 3) external_reference: extras:email:qtd:timestamp
    const ext = String(pay?.external_reference || '');
    if (!ext.startsWith('extras:')) {
      return res.status(200).json({ ok: true, ignored: 'not extras external_reference' });
    }

    const parts = ext.split(':'); // ["extras", email, qty, timestamp]
    const email = parts[1];
    const qty = Number(parts[2] || '1');

    if (!email || !Number.isFinite(qty) || qty <= 0) {
      return res.status(200).json({ ok: true, ignored: 'bad ext data', ext });
    }

    // 4) Buscar usuário
    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, extra_visits_purchased')
      .eq('email', email)
      .single();

    if (uErr || !user) {
      return res.status(200).json({ ok: true, ignored: 'user not found', email });
    }

    const current = Number(user.extra_visits_purchased || 0);
    const next = current + qty;

    // 5) Atualizar créditos
    const { error: upErr } = await supabaseAdmin
      .from('users')
      .update({ extra_visits_purchased: next })
      .eq('id', user.id);

    if (upErr) {
      return res.status(200).json({ ok: true, ignored: 'update failed', upErr });
    }

    return res.status(200).json({ ok: true, credited: qty, email, next });
  } catch (e: any) {
    // sempre 200 pro MP não insistir eternamente
    return res.status(200).json({ ok: true, ignored: 'exception', message: e?.message || String(e) });
  }
}
