import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

function getBaseUrl(req: VercelRequest) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  if (host) return `${proto}://${host}`;
  return "https://zeloo-gamma.vercel.app";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
    if (!accessToken) {
      return res.status(500).json({ ok: false, error: "MERCADOPAGO_ACCESS_TOKEN não configurado" });
    }

    const { email, qty, unitPrice } = (req.body ?? {}) as {
      email?: string;
      qty?: number;
      unitPrice?: number;
    };

    const payerEmail = String(email ?? "").trim().toLowerCase();
    if (!payerEmail || !payerEmail.includes("@")) {
      return res.status(400).json({ ok: false, error: "email inválido" });
    }

    const quantity = typeof qty === "number" && qty > 0 ? Math.floor(qty) : 1;
    const price = typeof unitPrice === "number" && unitPrice > 0 ? unitPrice : 0;

    if (price <= 0) {
      return res.status(400).json({ ok: false, error: "unitPrice inválido" });
    }

    const baseUrl = getBaseUrl(req);

    // identifica compra de extras
    const external_reference = `EXTRA|${payerEmail}|QTY:${quantity}`;

    // ✅ Tipagem relaxada (evita erro TS do SDK)
    const items: any[] = [
      {
        title: `Zeloo - Atendimentos extras (x${quantity})`,
        quantity: 1,
        unit_price: price * quantity,
        currency_id: "BRL",
      },
    ];

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const prefResp = await preference.create({
      body: {
        items,

        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        external_reference,
        payer: { email: payerEmail },

        back_urls: {
          success: `${baseUrl}/pos-pagamento?email=${encodeURIComponent(payerEmail)}`,
          pending: `${baseUrl}/pos-pagamento?email=${encodeURIComponent(payerEmail)}`,
          failure: `${baseUrl}/?payment=failure&email=${encodeURIComponent(payerEmail)}`,
        },

        auto_return: "approved",
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
    console.error("EXTRA CHECKOUT ERROR:", e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Erro desconhecido" });
  }
}
