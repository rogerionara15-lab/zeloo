import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const {
      plan_name,
      plan_tier,
      plan_price,
      name,
      cpf,
      phone,
      cep,
      address,
      number,
      complement,
      email,
      source,
    } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid name' });
    }
    if (!cpf || typeof cpf !== 'string') {
      return res.status(400).json({ error: 'Invalid cpf' });
    }
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Invalid phone' });
    }

    // ✅ Tabela sugerida: leads
    // Se você não tiver essa tabela, eu te passo o SQL já já.
    const payload = {
      plan_name: plan_name || null,
      plan_tier: plan_tier || null,
      plan_price: plan_price || null,
      name,
      cpf,
      phone,
      cep: cep || null,
      address: address || null,
      number: number || null,
      complement: complement || null,
      email: String(email).trim().toLowerCase(),
      source: source || 'checkout',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('leads').insert(payload);

    if (error) {
      return res.status(500).json({ error: 'Supabase insert failed', details: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
}
