// useSubscriptionGate.ts
import { useEffect, useState } from 'react';
import { checkSubscriptionGate, SubscriptionGateResult } from './subscriptionGate';

export function useSubscriptionGate(userId?: string | null) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SubscriptionGateResult | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!userId) {
        if (!alive) return;
        setResult({
          ok: false,
          reason: 'NOT_FOUND',
          message: 'Usuário não identificado.',
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await checkSubscriptionGate(userId);
      if (!alive) return;
      setResult(res);
      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [userId]);

  return { loading, result, allowed: result?.ok === true };
}