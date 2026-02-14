export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({
        error: 'Missing MERCADOPAGO_ACCESS_TOKEN in server environment.',
      });
    }

    const { email, quantity, price, title } = req.body || {};

    const qty = Number(quantity);
    const unitPrice = Number(price);

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid: email' });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Missing or invalid: quantity' });
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ error: 'Missing or invalid: price' });
    }

    const itemTitle =
      typeof title === 'string' && title.trim().length > 0
        ? title.trim()
        : `Zeloo - Atendimentos extras (${qty}x)`;

    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${proto}://${host}` : '';

    const successUrl = baseUrl
  ? `${baseUrl}/pos-extra?email=${encodeURIComponent(email)}&qtd=${encodeURIComponent(String(qty))}`
  : undefined;

const failureUrl = baseUrl
  ? `${baseUrl}/pos-extra?status=failure&email=${encodeURIComponent(email)}&qtd=${encodeURIComponent(String(qty))}`
  : undefined;

const pendingUrl = baseUrl
  ? `${baseUrl}/pos-extra?status=pending&email=${encodeURIComponent(email)}&qtd=${encodeURIComponent(String(qty))}`
  : undefined;


    const preferencePayload: any = {
      items: [
        {
          title: itemTitle,
          quantity: qty,
          unit_price: unitPrice,
          currency_id: 'BRL',
        },
      ],
      payer: { email },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      external_reference: `extras:${email}:${qty}:${Date.now()}`,

    };

    if (!baseUrl) {
      delete preferencePayload.back_urls;
      delete preferencePayload.auto_return;
    }

    const mpResp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpJson = await mpResp.json().catch(() => null);

    if (!mpResp.ok) {
      return res.status(500).json({
        error: 'Mercado Pago preference creation failed',
        status: mpResp.status,
        details: mpJson,
      });
    }

    const initPoint = mpJson?.init_point;
    if (!initPoint) {
      return res.status(500).json({
        error: 'Mercado Pago did not return init_point',
        details: mpJson,
      });
    }

    return res.status(200).json({
  init_point: initPoint,
  debug: {
    success: preferencePayload?.back_urls?.success,
    failure: preferencePayload?.back_urls?.failure,
    pending: preferencePayload?.back_urls?.pending,
    external_reference: preferencePayload?.external_reference,
    baseUrl,
  },
});

  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err?.message || String(err),
    });
  }
}
