import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) Aceita somente POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 2) Pega o token do Mercado Pago (variável de ambiente)
    const accessTokenRaw = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
const accessToken = accessTokenRaw.trim();

    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error: "MERCADOPAGO_ACCESS_TOKEN não configurado",
      });
    }

    // 3) Lê e valida o body
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

    // 4) Configura SDK Mercado Pago
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // 5) Itens do checkout (fora do body, do jeito certo)
    const items: any[] = [
      {
        title: title,
        quantity: qty,
        unit_price: price,
        currency_id: "BRL",
      },
    ];

    // 6) Cria a preferência
    const prefResp = await preference.create({
      body: {
        items: items,
        back_urls: {
          success: "https://zeloo-gamma.vercel.app/",
          pending: "https://zeloo-gamma.vercel.app/",
          failure: "https://zeloo-gamma.vercel.app/",
        },
        auto_return: "approved",
      },
    });

    // 7) Alguns SDKs retornam dentro de ".body"
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
