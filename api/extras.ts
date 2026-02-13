import type { VercelRequest, VercelResponse } from '@vercel/node';
import mercadopago from 'mercadopago';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'Missing env: MERCADOPAGO_ACCESS_TOKEN' });
    }

    mercadopago.configure({ access_token: accessToken });

    const { email, quantity, price, title } = req.body || {};
    const cleanEmail = normalizeEmail(email);
    const qty = Number(quantity || 1);
    const unitPrice = Number(price || 0);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    if (!unitPrice || unitPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const preference = {
      items: [
        {
          title: title || `Zeloo - Atendimentos extras (${qty}x)`,
          quantity: qty,
          currency_id: 'BRL',
          unit_price: unitPrice,
        },
      ],
      metadata: {
        type: 'extra_visits',
        email: cleanEmail,
        quantity: qty,
      },
      back_urls: {
        success: `${req.headers.origin}/payment-success?type=extras`,
        failure: `${req.headers.origin}/dashboard`,
        pending: `${req.headers.origin}/dashboard`,
      },
      auto_return: 'approved',
    };

    const mpResp = await mercadopago.preferences.create(preference as any);
    const init_point = mpResp?.body?.init_point;

    if (!init_point) {
      console.error('MP response missing init_point:', mpResp?.body);
      return res.status(500).json({ error: 'Mercado Pago response missing init_point' });
    }

    return res.status(200).json({ init_point });
  } catch (err: any) {
    console.error('EXTRAS API ERROR:', err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
}
