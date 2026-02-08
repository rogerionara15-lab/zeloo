import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error: "MERCADOPAGO_ACCESS_TOKEN não configurado na Vercel",
      });
    }

    const { title, price, quantity } = (req.body ?? {}) as {
      title?: string;
      price?: number;
      quantity?: number;
    };

    if (!title || typeof title !== "string") {
      return res.status(400).json({ ok: false, error: "title inválido" });
    }

    if (typeof price !== "number" || Number.isNaN(price) || price <= 0) {
      return res.status(400).json({ ok: false, error: "price inválido" });
    }

    const qty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items: [
          {
            title,
            quantity: qty,
            unit_price: price,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: "https://zeloo-gamma.vercel.app/",
          pending: "https://zeloo-gamma.vercel.app/",
          failure: "https://zeloo-gamma.vercel.app/",
        },
        auto_return: "approved",
      },
    });

    return res.status(200).json({
      ok: true,
      preferenceId: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "Erro desconhecido" });
  }
}
