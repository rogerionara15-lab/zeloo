import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId é obrigatório" });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase
      .from("profiles")
      .update({ payment_status: "PAID" })
      .eq("id", userId);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, status: "PAID" });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "Erro desconhecido" });
  }
}
