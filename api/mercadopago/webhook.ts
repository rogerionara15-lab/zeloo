import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

function asString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function asNumber(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
    if (!supabaseUrl || !serviceRoleKey) {
      console.log("WEBHOOK: SUPABASE env ausente.");
      return res.status(200).json({ ok: true });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2) Buscar o pagamento completo no MP
    const mp = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(mp);

    const paymentResp = await paymentApi.get({ id: String(paymentId) });
    const payment: any = (paymentResp as any)?.body ?? paymentResp;

    const mpStatusRaw = asString(payment?.status).toLowerCase(); // approved | pending | rejected | ...
    const mpStatusDetail = asString(payment?.status_detail);
    const paymentIdFinal = asString(payment?.id || paymentId);

    const externalRef = asString(payment?.external_reference).trim().toLowerCase();
    const payerEmail = asString(payment?.payer?.email).trim().toLowerCase();
    const email = externalRef || payerEmail;

    const metadataKind = asString(payment?.metadata?.kind).toUpperCase(); // PLAN | EXTRA_VISITS
    const metadataExtraQty = asNumber(payment?.metadata?.extra_qty);

    console.log("WEBHOOK PAYMENT:", {
      id: paymentIdFinal,
      status: mpStatusRaw,
      status_detail: mpStatusDetail,
      email,
      metadata_kind: metadataKind,
      metadata_extra_qty: metadataExtraQty,
    });

    if (!email || !email.includes("@")) {
      console.log("WEBHOOK: email não encontrado (external_reference/payer.email vazios).");
      return res.status(200).json({ ok: true });
    }

    // 3) Sempre gravar histórico em payments
    const paymentsUpsert = await supabase
      .from("payments")
      .upsert(
        {
          payment_id: paymentIdFinal,
          email,
          status: mpStatusRaw.toUpperCase(),
          status_detail: mpStatusDetail || null,
          raw: payment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );

    if (paymentsUpsert.error) {
      console.log("WEBHOOK SUPABASE payments ERROR:", paymentsUpsert.error);
    } else {
      console.log("WEBHOOK: payments upsert OK:", paymentIdFinal);
    }

    // 4) Se aprovado: liberar acesso e (se for extras) creditar
    if (mpStatusRaw === "approved") {
      // ✅ Proteção anti-duplicação:
      // Se esse payment_id já existir em paid_access, significa que já processamos esse pagamento.
      const { data: already, error: alreadyErr } = await supabase
        .from("paid_access")
        .select("payment_id")
        .eq("payment_id", paymentIdFinal)
        .maybeSingle();

      if (alreadyErr) {
        console.log("WEBHOOK: erro ao checar duplicidade paid_access:", alreadyErr);
      }

      const alreadyProcessed = !!already?.payment_id;

      // 4.1) paid_access (sempre)
      const paidAccessUpsert = await supabase
        .from("paid_access")
        .upsert(
          {
            payment_id: paymentIdFinal,
            email,
            status: "APPROVED",
            paid_at: new Date().toISOString(),
          },
          { onConflict: "payment_id" }
        );

      if (paidAccessUpsert.error) {
        console.log("WEBHOOK SUPABASE paid_access ERROR:", paidAccessUpsert.error);
      } else {
        console.log("WEBHOOK: paid_access upsert OK:", { email, payment_id: paymentIdFinal });
      }

      // 4.2) Se for compra de extras, creditar em profiles.extra_visits
      // Só credita se NÃO foi processado antes.
      if (!alreadyProcessed && metadataKind === "EXTRA_VISITS") {
        const qty = metadataExtraQty && metadataExtraQty > 0 ? Math.floor(metadataExtraQty) : null;

        if (!qty) {
          console.log("WEBHOOK: EXTRA_VISITS sem extra_qty válido. Ignorando crédito.");
          return res.status(200).json({ ok: true });
        }

        // Busca saldo atual
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("email, extra_visits")
          .eq("email", email)
          .maybeSingle();

        if (profErr) {
          console.log("WEBHOOK: erro ao buscar profile:", profErr);
          return res.status(200).json({ ok: true });
        }

        const current = Number(profile?.extra_visits ?? 0) || 0;
        const next = current + qty;

        const { error: updErr } = await supabase
          .from("profiles")
          .update({ extra_visits: next })
          .eq("email", email);

        if (updErr) {
          console.log("WEBHOOK: erro ao creditar extra_visits:", updErr);
        } else {
          console.log("WEBHOOK: extra_visits creditado OK:", { email, added: qty, from: current, to: next });
        }
      } else if (alreadyProcessed && metadataKind === "EXTRA_VISITS") {
        console.log("WEBHOOK: pagamento de extras já processado antes. Não creditar novamente.");
      }
    } else {
      console.log("WEBHOOK: status não aprovado ainda, mantendo só em payments:", mpStatusRaw);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.log("WEBHOOK ERROR:", e?.message || e);
    return res.status(200).json({ ok: true });
  }
}
