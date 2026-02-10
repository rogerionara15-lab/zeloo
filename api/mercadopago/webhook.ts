import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Variáveis de ambiente ausentes");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);

    const paymentId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.body?.id;

    if (!paymentId) {
      return res.status(200).json({ ok: true });
    }

    const payment = await paymentApi.get({ id: String(paymentId) });

    if (payment.status !== "approved") {
      return res.status(200).json({ ok: true });
    }

    const email =
      payment.payer?.email?.toLowerCase()?.trim();

    if (!email) {
      throw new Error("Email do pagador não encontrado");
    }

    await supabase
      .from("paid_access")
      .upsert({
        email,
        payment_id: String(payment.id),
        status: "APPROVED",
        raw: payment,
      });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(200).json({ ok: true });
  }
}
