import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) Aceita somente POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 2) Token MP
    const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error: "MERCADOPAGO_ACCESS_TOKEN não configurado",
      });
    }

    // 3) Body
    const { title, price, quantity, email } = (req.body ?? {}) as {
      title?: string;
      price?: number;
      quantity?: number;
      email?: string;
    };

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

    // 4) SDK MP
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // 5) Itens (tipado como any pra não brigar com TS)
    const items: any[] = [
      {
        title,
        quantity: qty,
        unit_price: price,
        currency_id: "BRL",
      },
    ];

    // 6) URLs
    const baseUrl = "https://zeloo-gamma.vercel.app";
    const successUrl = `${baseUrl}/pos-pagamento?email=${encodeURIComponent(payerEmail)}`;

    // 7) Cria preference
    const prefResp = await preference.create({
      body: {
        items,

        // 🔥 garante webhook na Vercel (não depende do painel)
        notification_url: `${baseUrl}/api/mercadopago/webhook`,

        // 🔥 identificação do comprador para liberação
        external_reference: payerEmail,

        payer: { email: payerEmail },

        back_urls: {
          success: successUrl,
          pending: successUrl,
          failure: successUrl,
        },
      },
    });

    // 8) alguns SDKs retornam dentro de ".body"
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
