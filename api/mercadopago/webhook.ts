import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

function asString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MP chama via POST. GET no navegador é só teste.
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
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

    const mpStatusRaw = asString(payment?.status).toLowerCase(); // approved | pending | rejected | ...
    const mpStatusDetail = asString(payment?.status_detail);
    const paymentIdFinal = asString(payment?.id || paymentId);

    console.log("WEBHOOK PAYMENT STATUS:", {
      id: paymentIdFinal,
      status: mpStatusRaw,
      status_detail: mpStatusDetail,
      external_reference: payment?.external_reference,
      payer_email: payment?.payer?.email,
    });

    // 3) Pegar email (preferir external_reference que você setou no checkout)
    const externalRef = asString(payment?.external_reference).trim().toLowerCase();
    const payerEmail = asString(payment?.payer?.email).trim().toLowerCase();
    const email = externalRef || payerEmail;

    if (!email || !email.includes("@")) {
      console.log("WEBHOOK: email não encontrado (external_reference/payer.email vazios).");
      // Ainda assim retornamos 200 pra não criar retry infinito
      return res.status(200).json({ ok: true });
    }

    // 4) Supabase client (service role)
    const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.log("WEBHOOK: SUPABASE env ausente.");
      return res.status(200).json({ ok: true });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 5) Sempre gravar histórico em payments (isso explica pq sua payments estava vazia)
    // (Se sua tabela payments NÃO tiver colunas raw/status_detail/updated_at, me diga que eu adapto.)
    const paymentsUpsert = await supabase
      .from("payments")
      .upsert(
        {
          payment_id: paymentIdFinal,
          email,
          status: mpStatusRaw.toUpperCase(),
          status_detail: mpStatusDetail || null,
          raw: payment, // precisa ser jsonb na tabela
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );

    if (paymentsUpsert.error) {
      console.log("WEBHOOK SUPABASE payments ERROR:", paymentsUpsert.error);
      // não retorna erro, mas loga para você ver
    } else {
      console.log("WEBHOOK: payments upsert OK:", paymentIdFinal);
    }

    // 6) Se aprovado, liberar acesso (paid_access)
    if (mpStatusRaw === "approved") {
      const paidAccessUpsert = await supabase
        .from("paid_access")
        .upsert(
          {
            payment_id: paymentIdFinal,
            email,
            status: "APPROVED",
            paid_at: new Date().toISOString(),
          },
          // 🔥 MUITO IMPORTANTE: conflito por payment_id (não por email)
          { onConflict: "payment_id" }
        );

      if (paidAccessUpsert.error) {
        console.log("WEBHOOK SUPABASE paid_access ERROR:", paidAccessUpsert.error);
      } else {
        console.log("WEBHOOK: paid_access upsert OK:", { email, payment_id: paymentIdFinal });
      }
    } else {
      console.log("WEBHOOK: status não aprovado ainda, mantendo só em payments:", mpStatusRaw);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.log("WEBHOOK ERROR:", e?.message || e);
    // 200 pra evitar loop agressivo de retries enquanto debugamos
    return res.status(200).json({ ok: true });
  }
}
