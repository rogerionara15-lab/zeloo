import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function fetchPayment(paymentId: string) {
  const raw = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  const token = raw.trim();
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.message || `Erro ao buscar payment (${resp.status})`);
  }
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Mercado Pago manda POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // MP pode mandar o id em formatos diferentes
    const paymentId =
      (req.query?.["data.id"] as string) ||
      (req.body?.data?.id as string) ||
      (req.body?.id as string);

    if (!paymentId) {
      // responde 200 para o MP não ficar reenviando
      return res.status(200).json({ ok: true, info: "Sem paymentId" });
    }

    // Busca detalhes do pagamento na API do MP (fonte de verdade)
    const payment = await fetchPayment(String(paymentId));

    const status = payment?.status;
    const userId = payment?.external_reference || payment?.metadata?.user_id;

    if (!userId) {
      return res.status(200).json({
        ok: true,
        warning: "Pagamento ok, mas sem external_reference/metadata para mapear usuário",
        paymentId,
        status,
      });
    }

    // Só libera se aprovado
    if (status === "approved") {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from("profiles")
        .update({ payment_status: "PAID" })
        .eq("id", userId);

      if (error) throw new Error(error.message);

      return res.status(200).json({ ok: true, updated: true, userId, paymentId, status });
    }

    return res.status(200).json({ ok: true, updated: false, userId, paymentId, status });
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ ok: false, error: err?.message ?? "Erro no webhook" });
  }
}
