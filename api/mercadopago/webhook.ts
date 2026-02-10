import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MP chama via POST. GET no navegador é só teste.
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // ✅ LOG 1: confirma que o webhook está sendo chamado
    console.log("WEBHOOK HIT:", {
      method: req.method,
      query: req.query,
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
    });

    // Body pode vir como objeto ou string
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // mantém string
      }
    }

    console.log("WEBHOOK BODY RAW:", body);

    // 1) Capturar paymentId em vários formatos
    let paymentId: string | undefined =
      body?.data?.id ||
      body?.id ||
      (typeof req.query?.["data.id"] === "string" ? (req.query["data.id"] as string) : undefined);

    // Às vezes vem `resource` como URL
    const resource: string | undefined = body?.resource;
    if (!paymentId && resource && typeof resource === "string") {
      const match = resource.match(/\/v1\/payments\/(\d+)/) || resource.match(/\/payments\/(\d+)/);
      if (match?.[1]) paymentId = match[1];
    }

    if (!paymentId) {
      console.log("WEBHOOK: paymentId não encontrado. Nada a fazer.");
      // Retorna 200 pra não ficar re-tentando sem necessidade
      return res.status(200).json({ ok: true });
    }

    const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
    if (!accessToken) {
      console.log("WEBHOOK: MERCADOPAGO_ACCESS_TOKEN ausente");
      return res.status(200).json({ ok: true });
    }

    // 2) Buscar o pagamento completo no MP
    const mp = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(mp);

    const paymentResp = await paymentApi.get({ id: String(paymentId) });
    const payment: any = (paymentResp as any)?.body ?? paymentResp;

    console.log("WEBHOOK PAYMENT STATUS:", {
      id: payment?.id,
      status: payment?.status,
      external_reference: payment?.external_reference,
      payer_email: payment?.payer?.email,
    });

    // 3) Pegar email (preferir external_reference)
    const externalRef = String(payment?.external_reference || "").trim().toLowerCase();
    const payerEmail = String(payment?.payer?.email || "").trim().toLowerCase();
    const email = externalRef || payerEmail;

    if (!email || !email.includes("@")) {
      console.log("WEBHOOK: email não encontrado no pagamento.");
      return res.status(200).json({ ok: true });
    }

    // 4) Se aprovado, grava no Supabase
    if (payment?.status === "approved") {
      const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
      const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

      if (!supabaseUrl || !serviceRoleKey) {
        console.log("WEBHOOK: SUPABASE env ausente.");
        return res.status(200).json({ ok: true });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // upsert por email (evita duplicar)
      const { error } = await supabase
        .from("paid_access")
        .upsert(
          {
            email,
            status: "APPROVED",
            payment_id: String(payment?.id ?? paymentId),
            paid_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (error) {
        console.log("WEBHOOK SUPABASE ERROR:", error);
      } else {
        console.log("WEBHOOK: paid_access atualizado com sucesso:", email);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.log("WEBHOOK ERROR:", e?.message || e);
    // 200 pra evitar loop agressivo de retries enquanto debugamos
    return res.status(200).json({ ok: true });
  }
}
