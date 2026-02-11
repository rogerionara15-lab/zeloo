import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

function getBaseUrl(req: VercelRequest) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";

  if (host) return `${proto}://${host}`;
  return "https://zeloo-gamma.vercel.app";
}

type CheckoutBody = {
  title?: string;
  price?: number;
  quantity?: number;
  email?: string;

  // ✅ NOVO (para diferenciar compra de plano vs extras)
  kind?: "PLAN" | "EXTRA_VISITS";
  extraQty?: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error: "MERCADOPAGO_ACCESS_TOKEN não configurado",
      });
    }

    const { title, price, quantity, email, kind, extraQty } = (req.body ?? {}) as CheckoutBody;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ ok: false, error: "title inválido" });
    }

    if (typeof price !== "number" || Number.isNaN(price) || price <= 0) {
      return res.status(400).json({ ok: false, error: "price inválido" });
    }

    const payerEmail = String(email ?? "").trim().toLowerCase();
    if (!payerEmail || !payerEmail.includes("@")) {
      return res.status(400).json({ ok: false, error: "email inválido" });
    }

    const qty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

    // ✅ define tipo da compra (padrão: PLAN)
    const purchaseKind: "PLAN" | "EXTRA_VISITS" = kind === "EXTRA_VISITS" ? "EXTRA_VISITS" : "PLAN";

    // ✅ valida extraQty se for compra de extras
    let normalizedExtraQty: number | null = null;
    if (purchaseKind === "EXTRA_VISITS") {
      const n = Number(extraQty);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({ ok: false, error: "extraQty inválido" });
      }
      normalizedExtraQty = Math.floor(n);
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const items: any[] = [
      {
        title,
        quantity: qty,
        unit_price: price,
        currency_id: "BRL",
      },
    ];

    const baseUrl = getBaseUrl(req);

    const posPagamentoUrl = `${baseUrl}/pos-pagamento?email=${encodeURIComponent(payerEmail)}`;
    const failureUrl = `${baseUrl}/?payment=failure&email=${encodeURIComponent(payerEmail)}`;

    const prefResp = await preference.create({
      body: {
        items,

        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        external_reference: payerEmail,
        payer: { email: payerEmail },

        // ✅ retorno do MP
        back_urls: {
          success: posPagamentoUrl,
          pending: posPagamentoUrl,
          failure: failureUrl,
        },

        auto_return: "approved",

        // ✅ NOVO: metadata para o webhook saber o que foi comprado
        metadata: {
          kind: purchaseKind,
          extra_qty: normalizedExtraQty, // null quando for PLAN
          buyer_email: payerEmail,
        },
      },
    });

    const pref: any = (prefResp as any)?.body ?? prefResp;

    return res.status(200).json({
      ok: true,
      preferenceId: pref?.id,
      init_point: pref?.init_point,
      sandbox_init_point: pref?.sandbox_init_point,
    });
  } catch (e: any) {
    console.error("CHECKOUT ERROR:", e);
    return res.status(500).json({
      ok: false,
      error: e?.message ?? "Erro desconhecido",
    });
  }
}
