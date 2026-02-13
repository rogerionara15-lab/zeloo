export default async function handler(req: any, res: any) {
  // Só aceitamos POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Garantir token
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({
        error: 'Missing MERCADOPAGO_ACCESS_TOKEN in server environment.',
      });
    }

    // Body
    const { email, quantity, price, title } = req.body || {};

    // Validações
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

    // Título padrão caso venha vazio
    const itemTitle =
      typeof title === 'string' && title.trim().length > 0
        ? title.trim()
        : `Zeloo - Atendimentos extras (${qty}x)`;

    // URL base do site (pra voltar corretamente após pagamento)
    // 1) se você tiver VITE_APP_URL no front, ok — mas aqui no backend,
    // a gente usa o host da request como fallback.
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${proto}://${host}` : '';

    // Rotas de retorno (ajuste se seu front usa outra página)
    const successUrl = baseUrl ? `${baseUrl}/dashboard?extra=success` : undefined;
    const failureUrl = baseUrl ? `${baseUrl}/dashboard?extra=failure` : undefined;
    const pendingUrl = baseUrl ? `${baseUrl}/dashboard?extra=pending` : undefined;

    // Monta preference
    const preferencePayload: any = {
      items: [
        {
          title: itemTitle,
          quantity: qty,
          unit_price: unitPrice,
          currency_id: 'BRL',
        },
      ],

      payer: {
        email,
      },

      // Voltar pro seu site após pagamento
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },

      auto_return: 'approved',

      // Identificador interno (ajuda a rastrear no MP)
      external_reference: `extras:${email}:${Date.now()}`,
    };

    // Se baseUrl não existir (muito raro), remove back_urls pra não quebrar
    if (!baseUrl) {
      delete preferencePayload.back_urls;
      delete preferencePayload.auto_return;
    }

    // Chamada REST ao Mercado Pago
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
        details: mpJson,
        status: mpResp.status,
      });
    }

    const initPoint = mpJson?.init_point;
    if (!initPoint) {
      return res.status(500).json({
        error: 'Mercado Pago did not return init_point',
        details: mpJson,
      });
    }

    return res.status(200).json({ init_point: initPoint });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Unexpected server error on /api/extras',
      message: err?.message || String(err),
    });
  }
}
