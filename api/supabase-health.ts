import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        ok: false,
        error:
          "Variáveis do Supabase no backend não configuradas (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Teste simples: lista 1 usuário (não altera nada)
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, usersChecked: data.users.length });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "Erro desconhecido" });
  }
}
