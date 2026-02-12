import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabaseAdmin';




function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const normalized = normalizeEmail(email);

    // 1) Confere se está aprovado no paid_access
    const { data: accessRow, error: accessErr } = await supabaseAdmin
      .from('paid_access')
      .select('email, status')
      .eq('email', normalized)
      .maybeSingle();

    if (accessErr) {
      return res.status(500).json({ error: `Erro ao consultar paid_access: ${accessErr.message}` });
    }

    if (!accessRow || accessRow.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Acesso não aprovado para este e-mail.' });
    }

    // 2) Envia convite (cria usuário no Auth se não existir)
    const redirectTo =
      process.env.APP_URL
        ? `${process.env.APP_URL}/auth/callback`
        : undefined;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalized, {
      redirectTo,
    });

    if (error) {
      // Se já existir, o Supabase pode retornar erro dependendo da config.
      // A gente trata com uma mensagem amigável.
      return res.status(409).json({
        error:
          'Este e-mail já existe no sistema. Use "Esqueci minha senha" na tela de login para criar/recuperar a senha.',
        details: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      message:
        'Convite enviado! Verifique seu e-mail para criar sua senha e então faça login.',
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Erro inesperado' });
  }
}
