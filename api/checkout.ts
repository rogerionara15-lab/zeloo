import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

function getBaseUrl(req: VercelRequest) {
  // tenta montar a URL dinamicamente (bom pra preview deployments)
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";

  if (host) return `${proto}://${host}`;
  // fallback seguro
  return "https://zeloo-gamma.vercel.app";
}

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

    // 6) URLs (base dinâmica + fallback)
    const baseUrl = getBaseUrl(req);

    const posPagamentoUrl = `${baseUrl}/pos-pagamento?email=${encodeURIComponent(payerEmail)}`;
    const failureUrl = `${baseUrl}/?payment=failure&email=${encodeURIComponent(payerEmail)}`;

    // 7) Cria preference
    const prefResp = await preference.create({
      body: {
        items,

        // 🔥 garante webhook na Vercel (não depende do painel)
        notification_url: `${baseUrl}/api/mercadopago/webhook`,

        // 🔥 identificação do comprador para liberação (use isso no webhook!)
        external_reference: payerEmail,

        // 🔥 ajuda a preencher dados do pagador
        payer: { email: payerEmail },

        // ✅ retorno do MP
        back_urls: {
          success: posPagamentoUrl,
          pending: posPagamentoUrl,
          failure: failureUrl,
        },

        // ✅ tenta voltar automaticamente quando aprovado (quando aplicável)
        auto_return: "approved",
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
